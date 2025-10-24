import { ObjectId } from 'mongodb'
import pLimit from 'p-limit'
import { inviteQueue } from '~/libs/bull/queues/inviteQueue'
import {
  CommunityCollection,
  CommunityInvitationCollection,
  CommunityInvitationSchema,
  CommunityMentorCollection,
  CommunitySchema
} from '~/models/schemas/Community.schema'
import { UserCollection } from '~/models/schemas/User.schema'
import { BadRequestError, ConflictError, NotFoundError } from '~/shared/classes/error.class'
import { CONSTANT_JOB } from '~/shared/constants'
import { CreateCommunityDto, InvitationMembersDto } from '~/shared/dtos/req/community.dto'
import { EInvitationStatus } from '~/shared/enums/status.enum'
import { EMembershipType, ENotificationType } from '~/shared/enums/type.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ICommunity } from '~/shared/interfaces/schemas/community.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'
import { slug } from '~/utils/slug.util'
import NotificationService from './Notification.service'
const limit = pLimit(10)

class CommunityService {
  async create(user_id: string, payload: CreateCommunityDto): Promise<boolean> {
    const exists = await CommunityCollection.countDocuments({ slug: slug(payload.name) })

    if (exists) {
      throw new ConflictError('Tên cộng đồng này đã được sử dụng.')
    }

    const inserted = await CommunityCollection.insertOne(
      new CommunitySchema({ ...payload, admin: new ObjectId(user_id) })
    )

    if (!inserted.insertedId) {
      throw new BadRequestError('Không thể tạo cộng đồng, vui lòng thử lại.')
    }

    try {
      if (Array.isArray(payload.member_ids) && payload.member_ids.length > 0) {
        await inviteQueue.add(CONSTANT_JOB.INVITE_COMMUNITY, {
          user_id,
          payload: { community_id: inserted.insertedId.toString(), member_ids: payload.member_ids }
        })
      }
    } catch (err) {
      throw new BadRequestError('Không thể mời thành viên, vui lòng thử lại.')
    }
    return true
  }

  async getAllCategories() {
    return await CommunityCollection.distinct('category')
  }

  async getMulti({
    query,
    user_id
  }: {
    user_id: string
    query: IQuery<ICommunity>
  }): Promise<ResMultiType<ICommunity>> {
    const { skip, limit, sort, q, qe } = getPaginationAndSafeQuery<ICommunity>(query)

    //
    const communities = await CommunityCollection.aggregate<CommunitySchema>([
      {
        $match: {
          $and: [
            {
              $or: [{ admin: { $in: [new ObjectId(user_id)] } }]
            },
            ...(q
              ? [
                  {
                    $or: [{ name: { $regex: q, $options: 'i' } }, { $text: { $search: q } }]
                  }
                ]
              : []),
            ...(qe
              ? [
                  {
                    $or: [
                      { visibilityType: { $regex: qe, $options: 'i' } },
                      { membershipType: { $regex: qe, $options: 'i' } }
                    ]
                  }
                ]
              : [])
          ]
        }
      },
      {
        $sort: sort
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'users',
          localField: 'admin',
          foreignField: '_id',
          as: 'admin',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                username: 1,
                avatar: 1
              }
            }
          ]
        }
      },
      {
        $unwind: {
          path: '$admin',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          bio: 0,
          category: 0
        }
      }
    ]).toArray()

    //
    const total = await CommunityCollection.countDocuments({
      $or: [
        {
          admin: {
            $in: [new ObjectId(user_id)]
          }
        }
      ],
      ...(q
        ? {
            $or: [{ name: { $regex: q, $options: 'i' } }, { $text: { $search: q } }]
          }
        : {})
    })

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: communities
    }
  }

  async getOneBySlug(slug: string): Promise<ICommunity> {
    const community = await CommunityCollection.aggregate<CommunitySchema>([
      {
        $match: {
          slug: slug
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'admin',
          foreignField: '_id',
          as: 'admin',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                username: 1,
                avatar: 1
              }
            }
          ]
        }
      },
      {
        $unwind: {
          path: '$admin',
          preserveNullAndEmptyArrays: true
        }
      }
    ]).next()

    if (!community) {
      throw new NotFoundError(`Không tìm thấy cộng đồng với slug ${slug}`)
    }

    return community
  }

  // Hàm này sẽ được worker gọi
  async inviteMembers({ user_id, payload }: { user_id: string; payload: InvitationMembersDto }) {
    const { member_ids, community_id } = payload
    const userObjId = new ObjectId(user_id)
    const communityObjId = new ObjectId(community_id)

    const community = await CommunityCollection.findOne(
      { _id: communityObjId },
      { projection: { name: 1, membershipType: 1 } }
    )

    if (community?.membershipType === EMembershipType.Invite_only) {
      const isMentor = await CommunityMentorCollection.findOne({
        community_id: communityObjId,
        user_id: userObjId
      })

      if (!isMentor) {
        throw new BadRequestError('Bạn không có quyền mời thành viên vào cộng đồng.')
      }
    }

    //
    const sender = await UserCollection.findOne({ _id: userObjId }, { projection: { name: 1 } })

    // Dừng nếu thiếu dữ liệu
    if (!sender || !community) {
      throw new BadRequestError('Invalid sender or community')
    }

    await Promise.all(
      member_ids.map((id) =>
        limit(async () => {
          const targetUserId = new ObjectId(id)

          // ✅ Kiểm tra nếu đã có lời mời trước đó
          const alreadyInvited = await CommunityInvitationCollection.findOne({
            user_id: targetUserId,
            community_id: communityObjId,
            status: EInvitationStatus.Pending // chỉ bỏ qua nếu đang chờ
          })

          if (alreadyInvited) return // 👈 bỏ qua nếu đã tồn tại

          // ✅ Tạo lời mời mới
          const invitation = new CommunityInvitationSchema({
            user_id: targetUserId,
            community_id: communityObjId
          })

          await Promise.all([
            CommunityInvitationCollection.insertOne(invitation),
            NotificationService.create({
              content: `${sender.name} đã mời bạn vào cộng đồng ${community.name}.`,
              type: ENotificationType.Community,
              sender: user_id,
              receiver: id,
              refId: community_id
            })
          ])
        })
      )
    )

    return true
  }

  //
  async inviteMembersOnQueue(payload: { user_id: string; payload: InvitationMembersDto }) {
    await inviteQueue.add(CONSTANT_JOB.INVITE_COMMUNITY, payload)
    return true
  }
}

export default new CommunityService()
