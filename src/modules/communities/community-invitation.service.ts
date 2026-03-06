import { ObjectId } from 'mongodb'
import pLimit from 'p-limit'
import { ForbiddenError, NotFoundError } from '~/core/error.response'
import { inviteQueue, notificationQueue } from '~/infra/queues'
import { CONSTANT_JOB } from '~/shared/constants'
import { IQuery } from '~/shared/interfaces/query.interface'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import CommunitiesService from '../communities/communities.service'
import { ENotificationType } from '../notifications/notifications.enum'
import { COLLECTION_USER_NAME, UsersCollection } from '../users/users.schema'
import { CreateCommunityInvitationDto, DeleteInvitationDto } from './communities.dto'
import { EInvitationStatus } from './communities.enum'
import { ICommunity, ICommunityPayload } from './communities.interface'
import { CommunityInvitationCollection, CommunityInvitationSchema } from './communities.schema'

const limit = pLimit(10)

class CommunityInvitationService {
  async create({ user_id, community, member_ids }: CreateCommunityInvitationDto) {
    const user_obj_id = new ObjectId(user_id)

    //
    const sender = await UsersCollection.findOne({ _id: user_obj_id }, { projection: { name: 1 } })

    if (!sender) {
      throw new NotFoundError()
    }

    const created = await Promise.all(
      member_ids.map((id) =>
        limit(async () => {
          const target_user_id = new ObjectId(id)

          // ✅ Kiểm tra nếu đã có lời mời trước đó
          const alreadyInvited = await CommunityInvitationCollection.findOne({
            user_id: target_user_id,
            community_id: community._id,
            status: EInvitationStatus.Pending // chỉ bỏ qua nếu đang chờ
          })

          if (alreadyInvited) return // 👈 bỏ qua nếu đã tồn tại

          // ✅ Tạo lời mời mới
          const invitation = new CommunityInvitationSchema({
            inviter: user_obj_id,
            user_id: target_user_id,
            community_id: new ObjectId(community._id),
            exp: new Date(Date.now() + community.invite_expire_days * 24 * 60 * 60 * 1000)
          })

          //
          await notificationQueue.add(CONSTANT_JOB.SEND_NOTI, {
            content: `${sender.name} đã mời bạn vào cộng đồng ${community.name}.`,
            type: ENotificationType.Community,
            sender: user_id,
            receiver: id,
            ref_id: community._id?.toString()
          })

          await CommunityInvitationCollection.insertOne(invitation)
        })
      )
    )

    return created?.length > 0
  }

  async createInQueue(payload: CreateCommunityInvitationDto) {
    inviteQueue.add(CONSTANT_JOB.INVITE, payload)
  }

  async updateStatus(_id: ObjectId, status: EInvitationStatus) {
    await CommunityInvitationCollection.updateOne({ _id: _id }, { $set: { status: status } })
  }

  async getMultiByCommunityId({ queries, community_id }: { community_id: string; queries: IQuery<ICommunity> }) {
    const { skip, limit, sort } = getPaginationAndSafeQuery<ICommunity>(queries)

    const invitations = await CommunityInvitationCollection.aggregate([
      {
        $match: {
          community_id: new ObjectId(community_id)
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
          from: COLLECTION_USER_NAME,
          localField: 'user_id',
          foreignField: '_id',
          as: 'user_id',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                username: 1,
                avatar: 1,
                verify: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: COLLECTION_USER_NAME,
          localField: 'inviter',
          foreignField: '_id',
          as: 'inviter',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1
              }
            }
          ]
        }
      },
      {
        $unwind: {
          path: '$user_id',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$inviter',
          preserveNullAndEmptyArrays: true
        }
      }
    ]).toArray()

    const total = await CommunityInvitationCollection.countDocuments({ community_id: new ObjectId(community_id) })

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: invitations
    }
  }

  async getOneByUserIdAndCommunityId({ user_id, community_id }: ICommunityPayload) {
    return await CommunityInvitationCollection.findOne({
      user_id: new ObjectId(user_id),
      community_id: new ObjectId(community_id)
    })
  }

  async delete({ user_id, payload }: { user_id: string; payload: DeleteInvitationDto }) {
    const { is_admin, is_joined, is_mentor } = await CommunitiesService.validateCommunityAndMembership({
      user_id,
      community_id: payload.community_id
    })

    if (!is_joined) {
      throw new ForbiddenError('Bạn chưa tham gia vào cộng đồng.')
    }

    if (!is_admin && !is_mentor) {
      throw new ForbiddenError('Chủ sở hữu và điều hành viên mới có thể xoá lời mời (cho dù đó là lời mời của bạn).')
    }

    const deleted = await CommunityInvitationCollection.deleteOne({ _id: new ObjectId(payload.invitation_id) })
    return !!deleted.deletedCount
  }
}

export default new CommunityInvitationService()
