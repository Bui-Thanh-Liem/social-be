import { ObjectId } from 'mongodb'
import { signedCloudfrontUrl } from '~/cloud/aws/cloudfront.aws'
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '~/core/error.response'
import { clientMongodb } from '~/database/mongodb.db'
import {
  ChangeInfoDto,
  CreateCommunityActivityDto,
  CreateCommunityDto,
  InvitationMembersDto,
  UpdateDto
} from '~/shared/dtos/public/communities.dto'
import { notificationQueue } from '~/infra/queues'
import { ICommunity, ICommunityActivity, ICommunityPayload } from '~/shared/interfaces/public/community.interface'
import { IUser } from '~/shared/interfaces/public/user.interface'
import {
  CommunitiesCollection,
  CommunitiesSchema,
  CommunityActivityCollection,
  CommunityActivitySchema,
  CommunityMemberCollection,
  CommunityMentorCollection,
  CommunityPinCollection
} from '~/schemas/public/community.schema'
import { COLLECTION_USERS_NAME } from '~/schemas/public/user.schema'
import TweetsService from '~/services/public/tweets/tweets.service'
import { ResMultiDto } from '~/shared/dtos/common/res-multi.dto'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import { logger } from '~/utils/logger.util'
import { slug } from '~/utils/slug.util'
import { EActivityType, EInvitationStatus, EMembershipType } from '../../shared/enums/public/communities.enum'
import { ENotificationType } from '../../shared/enums/public/notifications.enum'
import { ETweetStatus } from '../../shared/enums/public/tweets.enum'
import { ESourceViolation } from '../../shared/enums/public/user-violations.enum'
import userViolationsService from '../common/user-violations.service'
import BadWordsService from '../private/bad-words.service'
import accessRecentService from './access-recents.service'
import CommunityInvitationService from './community-invitations.service'
import CommunityMemberService from './community-members.service'
import CommunityMentorService from './community-mentors.service'
import { CONSTANT_JOB } from '~/shared/constants/queue.constant'
import { getFilterQuery } from '~/utils/get-filter-query.util'

interface IPromoteDemote {
  actor_id: string
  target_id: string
  community_id: string
}

class CommunityService {
  async create(user_id: string, payload: CreateCommunityDto): Promise<string> {
    const exists = await CommunitiesCollection.countDocuments({ slug: slug(payload.name) })
    if (exists) {
      throw new ConflictError('Tên cộng đồng này đã được sử dụng.')
    }

    // Lọc từ cấm trong name và bio
    const [_name, _bio] = await Promise.all([
      BadWordsService.detectInText({ text: payload.name || '', user_id }),
      BadWordsService.detectInText({ text: payload.bio || '', user_id })
    ])

    // Tạo cộng đồng
    const inserted = await CommunitiesCollection.insertOne(
      new CommunitiesSchema({ ...payload, name: _name.text, bio: _bio.text, admin: new ObjectId(user_id) })
    )

    // Lưu vi phạm từ cấm
    if (_name.bad_words_ids.length > 0 || _bio.bad_words_ids.length > 0) {
      await userViolationsService.create({
        user_id: user_id,
        source: ESourceViolation.Community,
        source_id: inserted.insertedId.toString(),
        final_content: (_name.matched_words.join() || '') + (_bio.matched_words.join() || '') + (payload.name || ''),
        bad_word_ids: [_name.bad_words_ids, _bio.bad_words_ids].flat()
      })
    }

    if (!inserted.insertedId) {
      throw new BadRequestError('Không thể tạo cộng đồng, vui lòng thử lại.')
    }

    const community = await CommunitiesCollection.findOne(
      { _id: inserted.insertedId },
      { projection: { admin: 1, name: 1, membership_type: 1 } }
    )

    try {
      if (Array.isArray(payload.member_ids) && payload.member_ids.length > 0) {
        await CommunityInvitationService.createInQueue({
          user_id,
          community: community!,
          member_ids: payload.member_ids
        })
      }
    } catch (err) {
      throw new BadRequestError('Không thể mời thành viên, vui lòng thử lại.')
    }
    return inserted.insertedId.toString()
  }

  async changeInfo({
    user_id,
    payload,
    community_id
  }: {
    user_id: string
    community_id: string
    payload: ChangeInfoDto
  }) {
    //
    const { is_admin } = await this.validateCommunityAndMembership({ community_id, user_id })

    if (!is_admin) {
      throw new ForbiddenError('Chỉ chủ sở hữu mới có thể thay đổi thông tin.')
    }

    // Cập nhật thông tin cộng đồng
    const updated = await CommunitiesCollection.updateOne(
      { _id: new ObjectId(community_id) },
      {
        $set: { ...payload },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return !!updated.modifiedCount
  }

  async update({ user_id, payload }: { payload: UpdateDto; user_id: string }) {
    const { community_id } = payload
    const { is_admin } = await this.validateCommunityAndMembership({ community_id, user_id })

    if (!is_admin) {
      throw new ForbiddenError('Chỉ chủ sở hữu mới có thể thay đổi cài đặt.')
    }

    // Bỏ trường không cần thiết (đã có validate mongodb rồi)
    const { community_id: x, ...safePayload } = payload

    //
    const updated = await CommunitiesCollection.updateOne(
      { _id: new ObjectId(community_id) },
      {
        $set: { ...safePayload },
        $currentDate: {
          updated_at: true
        }
      }
    )

    return !!updated.modifiedCount
  }

  async inviteMembers({ user_id, payload, user }: { user_id: string; payload: InvitationMembersDto; user: IUser }) {
    const { community, is_admin, is_mentor } = await this.validateCommunityAndMembership({
      user_id,
      community_id: payload.community_id
    })

    if (community?.membership_type === EMembershipType.Invite_only) {
      if (!is_admin && !is_mentor) {
        throw new BadRequestError('Bạn không có quyền mời thành viên vào cộng đồng.')
      }
    }

    //
    console.log('user_id::', user_id)
    console.log('community_id::', payload.community_id)

    //
    await this.createActivity({
      actor_id: user_id,
      action: { message: `${user.name} vừa mời thành viên vào cộng đồng.`, key: EActivityType.Invite },
      community_id: payload.community_id
    })

    //
    return await CommunityInvitationService.createInQueue({
      user_id,
      community,
      member_ids: payload.member_ids
    })
  }

  async join({ user_id, community_id, user }: ICommunityPayload) {
    const { community, is_joined } = await this.validateCommunityAndMembership({ user_id, community_id })

    if (is_joined) {
      throw new BadRequestError('Bạn đã là thành viên của cộng đồng này.')
    }

    // Nếu cộng đồng chỉ cho phép mời
    if (community.membership_type === EMembershipType.Invite_only) {
      const invitation = await CommunityInvitationService.getOneByUserIdAndCommunityId({ user_id, community_id })

      if (!invitation) {
        throw new BadRequestError('Bạn không thể tự tham gia vào cộng đồng này hoặc lời mời đã hết hạn.')
      }

      if (invitation?.status !== EInvitationStatus.Pending) {
        throw new BadRequestError('Lời mời đã hết hiệu lực, vui lòng xin một lời mời mới.')
      }

      await CommunityInvitationService.updateStatus(invitation._id, EInvitationStatus.Accepted)
    }

    //
    await this.createActivity({
      actor_id: user_id,
      action: { message: `${user?.name} vừa tham gia cộng đồng.`, key: EActivityType.Join },
      community_id: community_id
    })

    return await CommunityMemberService.create({ user_id, community_id })
  }

  async leave({ user_id, community_id, user }: ICommunityPayload) {
    const { is_joined, community } = await this.validateCommunityAndMembership({ user_id, community_id })

    if (!is_joined) {
      throw new BadRequestError('Bạn không phải là thành viên của cộng đồng này.')
    }

    // Không cho phép admin rời khỏi cộng đồng của chính họ
    if (community.admin.toString() === user_id) {
      throw new BadRequestError('Admin không thể rời khỏi cộng đồng của mình.')
    }

    //
    await this.createActivity({
      actor_id: user_id,
      action: { message: `${user?.name} đã rời cộng đồng.`, key: EActivityType.Leave },
      community_id: community_id
    })

    return await Promise.all([
      CommunityMemberService.delete({ user_id, community_id }),
      CommunityMentorService.delete({ user_id, community_id })
    ])
  }

  async promoteMentor({ target_id, actor_id, community_id }: IPromoteDemote) {
    // Người đang cho người khác lên mentor là ai (actor)
    // Người được cho lên mentor là ai  (target)
    const [actor, target] = await Promise.all([
      this.validateCommunityAndMembership({ user_id: actor_id, community_id }),
      this.validateCommunityAndMembership({ user_id: target_id, community_id })
    ])

    if (!actor.is_admin) {
      throw new ForbiddenError('Chỉ chủ sở hữu mới có thể cho thành viên lên điều hành viên.')
    }

    if (!target.is_joined) {
      throw new NotFoundError('Người dùng không tồn tại trong cộng đồng này.')
    }

    //
    if (target.is_mentor) {
      throw new ConflictError('Người dùng này đã là điều hành viên.')
    }

    //
    if (!target.is_member) {
      throw new BadRequestError('Người dùng này không phải là thành viên trong cộng đồng.')
    }

    //
    await CommunityMentorService.checkLength({ user_id: actor_id, community_id })

    const session = clientMongodb.startSession()

    try {
      await session.withTransaction(async () => {
        // 1. Xóa member
        await CommunityMemberService.delete({ user_id: target_id, community_id, session })

        // 2. Tạo mentor
        await CommunityMentorService.create({ user_id: target_id, community_id, session })
      })
    } catch (error) {
      // ✅ Proper logging với context
      logger.error('Transaction failed during promote mentor', {
        target_id,
        community_id,
        actor_id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })

      throw new BadRequestError('Không thể thăng cấp quản trị viên. Vui lòng thử lại.')
    } finally {
      await session.endSession()
    }

    //
    try {
      await notificationQueue.add(CONSTANT_JOB.SEND_NOTI, {
        content: `Bạn đã trở thành điều hành viên của cộng đồng ${actor.community.name}.`,
        type: ENotificationType.Community,
        sender: actor_id,
        receiver: target_id,
        ref_id: actor.community._id?.toString()
      })
    } catch (err) {
      // Log nhưng không throw
      logger.warn('Failed to send promotion notification', {
        actor_id,
        target_id,
        community_id,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  async demoteMentor({ target_id, actor_id, community_id }: IPromoteDemote) {
    // Người đang cho người khác xuống members là ai (actor)
    // Người bị cho xuống members là ai  (target)
    const [actor, target] = await Promise.all([
      this.validateCommunityAndMembership({ user_id: actor_id, community_id }),
      this.validateCommunityAndMembership({ user_id: target_id, community_id })
    ])

    if (!actor.is_admin) {
      throw new ForbiddenError('Chỉ chủ sở hữu mới có thể cho điều hành viên xuống thành viên bình thường.')
    }

    if (!target.is_joined) {
      throw new NotFoundError('Người dùng không tồn tại trong cộng đồng này.')
    }

    //
    if (target.is_member) {
      throw new ConflictError('Người dùng này đang là thành viên bình thường.')
    }

    const session = clientMongodb.startSession()

    try {
      await session.withTransaction(async () => {
        // 1. Xóa mentor
        await CommunityMentorService.delete({ user_id: target_id, community_id, session })

        // 2. Tạo member
        await CommunityMemberService.create({ user_id: target_id, community_id, session })
      })
    } catch (error) {
      // ✅ Proper logging với context
      console.log(error)

      logger.error('Transaction failed during demote member', {
        target_id,
        community_id,
        actor_id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })

      throw new BadRequestError('Không thể giáng chức quản trị viên. Vui lòng thử lại.')
    } finally {
      await session.endSession()
    }

    //
    try {
      await notificationQueue.add(CONSTANT_JOB.SEND_NOTI, {
        content: `Bạn không còn là điều hành viên của cộng đồng ${actor.community.name}.`,
        type: ENotificationType.Community,
        sender: actor_id,
        receiver: target_id,
        ref_id: actor.community._id?.toString()
      })
    } catch (err) {
      // Log nhưng không throw
      logger.warn('Failed to send demote notification', {
        actor_id,
        target_id,
        community_id,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  async getAllCategories() {
    return await CommunitiesCollection.distinct('category')
  }

  async getAllBare(user_id: string) {
    const user_obj_id = new ObjectId(user_id)

    // Lấy danh sách community_id mà user là mentor/member
    const [mentor, member] = await Promise.all([
      CommunityMentorCollection.find({ user_id: user_obj_id }, { projection: { community_id: 1 } }).toArray(),
      CommunityMemberCollection.find({ user_id: user_obj_id }, { projection: { community_id: 1 } }).toArray()
    ])

    const joinedObjIds = [...mentor, ...member].map((x) => x.community_id)

    // Tạo query động
    const query: any = { $or: [{ admin: user_obj_id }] }
    if (joinedObjIds.length > 0) query.$or.push({ _id: { $in: joinedObjIds } })

    // Trả về danh sách cộng đồng (chỉ cần name)
    const communities = await CommunitiesCollection.find(query, { projection: { name: 1, cover: 1 } }).toArray()
    return this.signedCloudfrontCoverUrls(communities)
  }

  async getPinnedBare(user_id: string) {
    const user_obj_id = new ObjectId(user_id)

    // Lấy danh sách community_id mà user là mentor/member
    const pined = await CommunityPinCollection.find(
      { user_id: user_obj_id },
      { skip: 0, limit: 10, projection: { community_id: 1 } }
    ).toArray()

    const joinedObjIds = [...pined].map((x) => x.community_id)

    //
    if (joinedObjIds.length === 0) return []

    // Tạo query động
    const query: any = { _id: { $in: joinedObjIds } }

    // Trả về danh sách cộng đồng (chỉ cần name)
    return await CommunitiesCollection.find(query, { projection: { name: 1, slug: 1 } }).toArray()
  }

  async getMultiOwner({
    query,
    user_id
  }: {
    user_id: string
    query: IQuery<ICommunity>
  }): Promise<ResMultiType<ICommunity>> {
    const { skip, limit, sort, q, qe } = getPaginationAndSafeQuery<ICommunity>(query)

    //
    const communities = await CommunitiesCollection.aggregate<CommunitiesSchema>([
      {
        $match: {
          $and: [
            { admin: { $in: [new ObjectId(user_id)] } },
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
                      { visibility_type: { $regex: qe, $options: 'i' } },
                      { membership_type: { $regex: qe, $options: 'i' } }
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
          from: 'community-pins',
          localField: '_id',
          foreignField: 'community_id',
          as: 'pin',
          pipeline: [
            {
              $project: {
                user_id: 1
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
        $addFields: {
          pinned: {
            $in: [new ObjectId(user_id), '$pin.user_id']
          }
        }
      },
      {
        $project: {
          bio: 0,
          category: 0,
          pin: 0
        }
      }
    ]).toArray()

    //
    const total = await CommunitiesCollection.countDocuments({
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
      items: this.signedCloudfrontCoverUrls(communities) as ICommunity[]
    }
  }

  async getMultiJoined({
    query,
    user_id
  }: {
    user_id: string
    query: IQuery<ICommunity>
  }): Promise<ResMultiType<ICommunity>> {
    const { skip, limit, sort, q, qe } = getPaginationAndSafeQuery<ICommunity>(query)

    // "Cần cache"
    const joined = await Promise.all([
      CommunityMentorCollection.find({ user_id: new ObjectId(user_id) }, { projection: { community_id: 1 } }).toArray(),
      CommunityMemberCollection.find({ user_id: new ObjectId(user_id) }, { projection: { community_id: 1 } }).toArray()
    ])
    const joinedObjIds = joined.flatMap((x) => x).map((x) => x.community_id)

    //
    const communities = await CommunitiesCollection.aggregate<CommunitiesSchema>([
      {
        $match: {
          $and: [
            {
              _id: { $in: joinedObjIds }
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
                      { visibility_type: { $regex: qe, $options: 'i' } },
                      { membership_type: { $regex: qe, $options: 'i' } }
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
          from: 'community-pins',
          localField: '_id',
          foreignField: 'community_id',
          as: 'pin',
          pipeline: [
            {
              $project: {
                user_id: 1
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
        $addFields: {
          pinned: {
            $in: [new ObjectId(user_id), '$pin.user_id']
          }
        }
      },
      {
        $project: {
          bio: 0,
          category: 0,
          pin: 0
        }
      }
    ]).toArray()

    //
    const total = await CommunitiesCollection.countDocuments({
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
      items: this.signedCloudfrontCoverUrls(communities) as ICommunity[]
    }
  }

  async getMultiExplore({
    query,
    user_id
  }: {
    user_id: string
    query: IQuery<ICommunity>
  }): Promise<ResMultiType<ICommunity>> {
    const { skip, limit, sort, q, qe } = getPaginationAndSafeQuery<ICommunity>(query)

    const match_stage: Record<string, any> = {}

    if (q) {
      match_stage.$or = [{ $text: { $search: q } }, { name: { $regex: q, $options: 'i' } }]
    }

    if (qe) {
      match_stage.category = { $regex: qe, $options: 'i' }
    }

    //
    const communities = await CommunitiesCollection.aggregate<CommunitiesSchema>([
      { $match: match_stage },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },

      // 1️⃣ Lấy thông tin admin
      {
        $lookup: {
          from: COLLECTION_USERS_NAME,
          localField: 'admin',
          foreignField: '_id',
          as: 'admin',
          pipeline: [{ $project: { _id: 1, name: 1, avatar: 1, username: 1 } }]
        }
      },
      { $unwind: { path: '$admin', preserveNullAndEmptyArrays: true } },

      // 2️⃣ Lấy info member count + is_member
      {
        $lookup: {
          from: 'community-members',
          let: { communityId: '$_id', currentUserId: new ObjectId(user_id) },
          pipeline: [
            { $match: { $expr: { $eq: ['$community_id', '$$communityId'] } } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                is_member: { $max: { $eq: ['$user_id', '$$currentUserId'] } }
              }
            }
          ],
          as: 'membersInfo'
        }
      },

      // 3️⃣ Lấy info mentors count + is_mentor
      {
        $lookup: {
          from: 'community-mentors',
          let: { communityId: '$_id', currentUserId: new ObjectId(user_id) },
          pipeline: [
            { $match: { $expr: { $eq: ['$community_id', '$$communityId'] } } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                is_mentor: { $max: { $eq: ['$user_id', '$$currentUserId'] } }
              }
            }
          ],
          as: 'mentorsInfo'
        }
      },

      // 4️⃣ Lấy danh sách 5 members đầu tiên
      {
        $lookup: {
          from: 'community-members',
          localField: '_id',
          foreignField: 'community_id',
          as: 'memberRefs'
        }
      },
      {
        $lookup: {
          from: COLLECTION_USERS_NAME,
          localField: 'memberRefs.user_id',
          foreignField: '_id',
          as: 'members',
          pipeline: [
            { $project: { _id: 1, name: 1, avatar: 1, username: 1 } },
            { $limit: 5 } // 🔥 chỉ lấy 5 member
          ]
        }
      },

      // 5️⃣ Lấy danh sách 5 mentors đầu tiên
      {
        $lookup: {
          from: 'community-mentors',
          localField: '_id',
          foreignField: 'community_id',
          as: 'mentorRefs'
        }
      },
      {
        $lookup: {
          from: COLLECTION_USERS_NAME,
          localField: 'mentorRefs.user_id',
          foreignField: '_id',
          as: 'mentors',
          pipeline: [
            { $project: { _id: 1, name: 1, avatar: 1, username: 1 } },
            { $limit: 5 } // 🔥 chỉ lấy 5 mentor
          ]
        }
      },

      // 6️⃣ Add các flag logic
      {
        $addFields: {
          is_admin: { $eq: ['$admin._id', new ObjectId(user_id)] },
          is_joined: {
            $or: [
              { $eq: ['$admin._id', new ObjectId(user_id)] },
              { $ifNull: [{ $arrayElemAt: ['$membersInfo.is_member', 0] }, false] },
              { $ifNull: [{ $arrayElemAt: ['$mentorsInfo.is_mentor', 0] }, false] }
            ]
          },
          members_count: { $ifNull: [{ $arrayElemAt: ['$membersInfo.count', 0] }, 0] },
          mentors_count: { $ifNull: [{ $arrayElemAt: ['$mentorsInfo.count', 0] }, 0] }
        }
      },

      // 7️⃣ Loại bỏ field phụ
      {
        $project: {
          pin: 0,
          memberRefs: 0,
          mentorRefs: 0,
          membersInfo: 0,
          mentorsInfo: 0
        }
      }
    ]).toArray()

    //
    const total = await CommunitiesCollection.countDocuments(match_stage)

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: this.signedCloudfrontCoverUrls(communities) as ICommunity[]
    }
  }

  //
  async getOneBareInfoBySlug({ slug, user_id }: { slug: string; user_id?: string }): Promise<ICommunity> {
    const community = await CommunitiesCollection.aggregate<CommunitiesSchema>([
      // match slug
      {
        $match: {
          slug: { $regex: slug, $options: 'i' }
        }
      },

      // lookup admin info
      {
        $lookup: {
          from: COLLECTION_USERS_NAME,
          localField: 'admin',
          foreignField: '_id',
          as: 'admin',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                bio: 1,
                verify: 1,
                avatar: 1,
                username: 1
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
        $lookup: {
          from: 'community-invitations',
          localField: '_id',
          foreignField: 'community_id',
          as: 'invited',
          pipeline: [
            {
              $project: {
                user_id: 1
              }
            }
          ]
        }
      },

      // check if user follows admin
      {
        $lookup: {
          from: 'followers',
          let: { target_user_id: '$admin._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$followed_user_id', '$$target_user_id'] },
                    { $eq: ['$user_id', new ObjectId(user_id)] }
                  ]
                }
              }
            }
          ],
          as: 'userFollowCheck'
        }
      },

      // lookup members count + check if current user is member
      {
        $lookup: {
          from: 'community-members',
          let: { communityId: '$_id', currentUserId: new ObjectId(user_id) },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$community_id', '$$communityId'] } }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                is_member: {
                  $max: { $eq: ['$user_id', '$$currentUserId'] }
                }
              }
            }
          ],
          as: 'membersInfo'
        }
      },

      // lookup mentors count + check if current user is mentor
      {
        $lookup: {
          from: 'community-mentors',
          let: { communityId: '$_id', currentUserId: new ObjectId(user_id) },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$community_id', '$$communityId'] } }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                is_mentor: {
                  $max: { $eq: ['$user_id', '$$currentUserId'] }
                }
              }
            }
          ],
          as: 'mentorsInfo'
        }
      },

      // add fields
      {
        $addFields: {
          'admin.isFollow': { $gt: [{ $size: '$userFollowCheck' }, 0] },

          // ✅ Extract individual flags
          is_member: {
            $ifNull: [{ $arrayElemAt: ['$membersInfo.is_member', 0] }, false]
          },
          is_mentor: {
            $ifNull: [{ $arrayElemAt: ['$mentorsInfo.is_mentor', 0] }, false]
          },
          is_admin: {
            $eq: ['$admin._id', new ObjectId(user_id)]
          },

          // Total member count
          member_count: {
            $add: [
              { $ifNull: [{ $arrayElemAt: ['$membersInfo.count', 0] }, 0] },
              { $ifNull: [{ $arrayElemAt: ['$mentorsInfo.count', 0] }, 0] },
              1 // admin
            ]
          },

          // is_joined = is_admin OR is_member OR is_mentor
          is_joined: {
            $or: [
              { $eq: ['$admin._id', new ObjectId(user_id)] },
              { $ifNull: [{ $arrayElemAt: ['$membersInfo.is_member', 0] }, false] },
              { $ifNull: [{ $arrayElemAt: ['$mentorsInfo.is_mentor', 0] }, false] }
            ]
          }
        }
      },

      // project cleanup
      {
        $project: {
          userFollowCheck: 0,
          membersInfo: 0,
          mentorsInfo: 0
        }
      }
    ]).next()

    if (!community) {
      throw new NotFoundError(`Không tìm thấy cộng đồng với slug ${slug}`)
    }

    // Lưu vào truy cập gần đây
    await accessRecentService.create({
      user_id,
      type: 'community',
      ref_id: community._id?.toString() || ''
    })

    return this.signedCloudfrontCoverUrls(community) as ICommunity
  }

  //
  async getMultiMMById({
    community_id,
    user_id,
    queries
  }: {
    community_id: string
    user_id: string
    queries: IQuery<ICommunity>
  }): Promise<ICommunity> {
    const user_obj_id = new ObjectId(user_id)
    const community_obj_id = new ObjectId(community_id)
    const { skip, limit, q } = getPaginationAndSafeQuery<ICommunity>(queries)

    const community = await CommunitiesCollection.aggregate<CommunitiesSchema>([
      { $match: { _id: community_obj_id } },

      // mentors list
      {
        $lookup: {
          from: 'community-mentors',
          localField: '_id',
          foreignField: 'community_id',
          as: 'mentors',
          pipeline: [
            {
              $lookup: {
                from: COLLECTION_USERS_NAME,
                localField: 'user_id',
                foreignField: '_id',
                as: 'user',
                pipeline: [
                  {
                    $lookup: {
                      from: 'followers',
                      let: { target_user_id: '$_id' },
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $and: [
                                { $eq: ['$followed_user_id', '$$target_user_id'] },
                                { $eq: ['$user_id', user_obj_id] }
                              ]
                            }
                          }
                        }
                      ],
                      as: 'followCheck'
                    }
                  },
                  {
                    $addFields: {
                      isFollow: { $gt: [{ $size: '$followCheck' }, 0] }
                    }
                  },
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      bio: 1,
                      verify: 1,
                      avatar: 1,
                      username: 1,
                      isFollow: 1
                    }
                  }
                ]
              }
            },
            { $unwind: '$user' },
            { $replaceRoot: { newRoot: '$user' } }
          ]
        }
      },

      // members list - search trước khi lookup user details
      {
        $lookup: {
          from: 'community-members',
          let: { communityId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$community_id', '$$communityId'] }
              }
            },
            // Lookup user để có thể search
            {
              $lookup: {
                from: COLLECTION_USERS_NAME,
                localField: 'user_id',
                foreignField: '_id',
                as: 'userInfo'
              }
            },
            { $unwind: '$userInfo' },
            // Apply search filter nếu có
            ...(q
              ? [
                  {
                    $match: {
                      $or: [
                        { 'userInfo.name': { $regex: q, $options: 'i' } },
                        { 'userInfo.username': { $regex: q, $options: 'i' } }
                      ]
                    }
                  }
                ]
              : []),
            // Pagination sau khi search
            { $skip: skip },
            { $limit: limit },
            // Lookup follow status
            {
              $lookup: {
                from: 'followers',
                let: { target_user_id: '$userInfo._id' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [{ $eq: ['$followed_user_id', '$$target_user_id'] }, { $eq: ['$user_id', user_obj_id] }]
                      }
                    }
                  }
                ],
                as: 'followCheck'
              }
            },
            {
              $addFields: {
                'userInfo.isFollow': { $gt: [{ $size: '$followCheck' }, 0] }
              }
            },
            {
              $replaceRoot: {
                newRoot: {
                  _id: '$userInfo._id',
                  name: '$userInfo.name',
                  bio: '$userInfo.bio',
                  verify: '$userInfo.verify',
                  avatar: '$userInfo.avatar',
                  username: '$userInfo.username',
                  isFollow: '$userInfo.isFollow'
                }
              }
            }
          ],
          as: 'members'
        }
      },

      {
        $project: {
          members: 1,
          mentors: 1
        }
      }
    ]).next()

    if (!community) {
      throw new NotFoundError(`Không tìm thấy cộng đồng với id ${community_id}`)
    }

    return this.signedCloudfrontCoverUrls(community) as ICommunity
  }

  //
  async togglePin({ user_id, community_id }: ICommunityPayload) {
    const user_object_id = new ObjectId(user_id)
    const community_object_id = new ObjectId(community_id)

    const dataHandle = {
      user_id: user_object_id,
      community_id: community_object_id
    }

    // Check and delete if like exists
    const deleted = await CommunityPinCollection.findOneAndDelete(dataHandle)

    let status: 'Ghim' | 'Bỏ ghim'
    let id: string

    if (deleted?._id) {
      //
      status = 'Bỏ ghim'
      id = deleted._id.toString()
    } else {
      //
      const inserted = await CommunityPinCollection.insertOne(dataHandle)
      status = 'Ghim'
      id = inserted.insertedId.toString()
    }

    return { status, _id: id }
  }

  // Kiểm tra xem đã người dùng hiện tại có chức vụ gì trong cộng đồng
  async checkJoined({
    user_id,
    community_id,
    communityAdmin
  }: {
    user_id: string
    community_id: string
    communityAdmin: string
  }): Promise<{ is_joined: boolean; is_admin: boolean; is_mentor: boolean; is_member: boolean }> {
    //
    const existing = await Promise.all([
      CommunityMemberCollection.findOne({
        user_id: new ObjectId(user_id),
        community_id: new ObjectId(community_id)
      }),
      CommunityMentorCollection.findOne({
        user_id: new ObjectId(user_id),
        community_id: new ObjectId(community_id)
      })
    ])

    //
    return {
      is_member: !!existing[0],
      is_mentor: !!existing[1],
      is_admin: communityAdmin === user_id,
      is_joined: existing.filter(Boolean).length > 0 || communityAdmin === user_id
    }
  }

  async validateCommunityAndMembership({ user_id, community_id }: ICommunityPayload) {
    const community_obj_id = new ObjectId(community_id)

    const [community, mentorIds] = await Promise.all([
      CommunitiesCollection.findOne(
        { _id: community_obj_id },
        { projection: { admin: 1, name: 1, membership_type: 1, invite_expire_days: 1 } }
      ),
      CommunityMentorCollection.distinct('user_id', { community_id: community_obj_id })
    ])

    if (!community) {
      throw new NotFoundError('Không tìm thấy hoặc cộng đồng bạn muốn tham gia đã giải tán.')
    }

    const { is_joined, is_admin, is_mentor, is_member } = await this.checkJoined({
      user_id,
      community_id,
      communityAdmin: community.admin.toString()
    })

    return { community, mentorIds, is_joined, is_admin, is_mentor, is_member }
  }

  async changeStatusTweet({
    status,
    tweet_id,
    user_active,
    community_id
  }: {
    tweet_id: string
    user_active: IUser
    community_id: string
    status: ETweetStatus
  }) {
    const user_active_id = user_active._id!.toString()

    const { is_admin, is_mentor, community } = await this.validateCommunityAndMembership({
      community_id,
      user_id: user_active_id
    })

    //
    if (!is_admin && !is_mentor) {
      throw new BadRequestError('Chỉ chủ sở hữu và điều hành viên mới có quyền xem.')
    }

    const res = await TweetsService.changeStatusTweet({ tweet_id, status })
    if (res) {
      let mess = `${user_active.name} đã duyệt bài viết của bạn đăng trong cộng đồng ${community.name}`
      if (status === ETweetStatus.Reject) {
        mess = `${user_active.name} đã từ chối bài viết của bạn đăng trong cộng đồng ${community.name}`
      }

      //
      await notificationQueue.add(CONSTANT_JOB.SEND_NOTI, {
        content: mess,
        sender: user_active_id,
        ref_id: res._id?.toString(),
        receiver: res.user_id.toString(),
        type: ENotificationType.Community
      })
    }
  }

  //
  signedCloudfrontCoverUrls = (communities: ICommunity[] | ICommunity | null) => {
    //
    if (!communities) return communities

    //
    if (!Array.isArray(communities))
      return {
        ...communities,
        cover: {
          ...communities.cover,
          ...signedCloudfrontUrl(communities.cover)
        }
      }

    //
    return communities.map((community) => ({
      ...community,
      cover: {
        ...community.cover,
        ...signedCloudfrontUrl(community.cover)
      }
    }))
  }

  // ===== ACTIVITY =====
  async getMultiActivity({
    community_id,
    queries
  }: {
    community_id: string
    queries: IQuery<ICommunityActivity>
  }): Promise<ResMultiType<ICommunityActivity>> {
    const { skip, limit } = getPaginationAndSafeQuery<ICommunityActivity>(queries)
    const community_obj_id = new ObjectId(community_id)

    //
    const activities = await CommunityActivityCollection.find(
      { community_id: community_obj_id },
      { skip, limit }
    ).toArray()

    //
    const total = await CommunityActivityCollection.countDocuments({ community_id: community_obj_id })

    //
    return {
      total,
      total_page: Math.ceil(total / limit),
      items: activities
    }
  }

  private async createActivity(payload: CreateCommunityActivityDto): Promise<boolean> {
    const res = await CommunityActivityCollection.insertOne(
      new CommunityActivitySchema({
        action: payload.action,
        actor_id: new ObjectId(payload.actor_id),
        community_id: new ObjectId(payload.community_id)
      })
    )
    return !!res.insertedId
  }
  // ===== ACTIVITY =====

  // ===== ADMIN =====
  async adminGetCommunities({
    query
  }: {
    admin_id: string
    query: IQuery<ICommunity>
  }): Promise<ResMultiDto<ICommunity>> {
    const { skip, limit, sort, q, qf, sd, ed } = getPaginationAndSafeQuery<ICommunity>(query)
    let filter: any = q
      ? {
          $or: [{ name: { $regex: q, $options: 'i' } }, { username: { $regex: q, $options: 'i' } }]
        }
      : {}

    //
    filter = getFilterQuery<CommunitiesSchema>({ qf, filter, sd, ed })
    console.log('Filter:', filter)

    //
    const [communities, total] = await Promise.all([
      CommunitiesCollection.aggregate<CommunitiesSchema>([
        { $match: filter },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
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
                  star: 1,
                  verify: 1,
                  avatar: 1,
                  username: 1
                }
              }
            ]
          }
        },
        // count members
        {
          $lookup: {
            from: 'community-members',
            localField: '_id',
            foreignField: 'community_id',
            as: 'members'
          }
        },

        // count mentors
        {
          $lookup: {
            from: 'community-mentors',
            localField: '_id',
            foreignField: 'community_id',
            as: 'mentors'
          }
        },

        {
          $addFields: {
            member_count: { $size: '$members' },
            mentor_count: { $size: '$mentors' }
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
            members: 0,
            mentors: 0
          }
        }
      ]).toArray(),
      CommunitiesCollection.countDocuments({})
    ])

    //
    return {
      total,
      total_page: Math.ceil(total / limit),
      items: this.signedCloudfrontCoverUrls(communities) as ICommunity[]
    }
  }
  // ===== ADMIN =====
}

export default new CommunityService()
