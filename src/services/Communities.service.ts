import { ObjectId } from 'mongodb'
import {
  CommunityCollection,
  CommunityMemberCollection,
  CommunityMentorCollection,
  CommunityPinCollection,
  CommunitySchema
} from '~/models/schemas/Community.schema'
import { BadRequestError, ConflictError, NotFoundError } from '~/shared/classes/error.class'
import { CreateCommunityDto, InvitationMembersDto } from '~/shared/dtos/req/community.dto'
import { EMembershipType } from '~/shared/enums/type.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ICommunity } from '~/shared/interfaces/schemas/community.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'
import { slug } from '~/utils/slug.util'
import CommunityInvitationService from './Community-invitation.service'
import CommunityMemberService from './Community-member.service'

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
        await CommunityInvitationService.invite({
          user_id,
          payload: {
            community_id: inserted.insertedId.toString(),
            member_ids: payload.member_ids
          }
        })
      }
    } catch (err) {
      throw new BadRequestError('Không thể mời thành viên, vui lòng thử lại.')
    }
    return true
  }

  async join({ user_id, community_id }: { user_id: string; community_id: string }) {
    const userObjId = new ObjectId(user_id)
    const communityObjId = new ObjectId(community_id)

    // 1️⃣ Kiểm tra cộng đồng có tồn tại không
    const community = await CommunityCollection.findOne(
      { _id: communityObjId },
      { projection: { membershipType: 1, admin: 1 } }
    )

    // 2️⃣ Kiểm tra xem đã là thành viên chưa
    const existingMember = await Promise.all([
      CommunityMemberCollection.findOne({
        user_id: userObjId,
        community_id: communityObjId
      }),
      CommunityMentorCollection.findOne({
        user_id: userObjId,
        community_id: communityObjId
      })
    ])

    if (existingMember.length > 0 || community?.admin.equals(user_id)) {
      throw new BadRequestError('Bạn đã là thành viên của cộng đồng này.')
    }

    //
    if (!community) {
      throw new NotFoundError('Không tìm thấy hoặc cộng đồng bạn muốn tham gia đã giải tán.')
    }

    // 3️⃣ Nếu cộng đồng chỉ cho phép mời thì kiểm tra lời mời
    if (community.membershipType === EMembershipType.Invite_only) {
      const invitation = await CommunityInvitationService.getOneByUserIdAndCommunityId({ user_id, community_id })

      if (!invitation) {
        throw new BadRequestError('Bạn không thể tự tham gia vào cộng đồng này hoặc lời mời đã hết hạn.')
      }

      // ✅ Cập nhật trạng thái lời mời thành "accepted"
      await CommunityInvitationService.updateStatus(invitation._id)
    }

    await CommunityMemberService.create({ user_id, community_id })

    return true
  }

  async getAllCategories() {
    return await CommunityCollection.distinct('category')
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
          from: 'community-pin',
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

  async getMultiJoined({
    query,
    user_id
  }: {
    user_id: string
    query: IQuery<ICommunity>
  }): Promise<ResMultiType<ICommunity>> {
    const { skip, limit, sort, q, qe } = getPaginationAndSafeQuery<ICommunity>(query)

    //
    const joined = await Promise.all([
      CommunityMentorCollection.find({ user_id: new ObjectId(user_id) }, { projection: { community_id: 1 } }).toArray(),
      CommunityMemberCollection.find({ user_id: new ObjectId(user_id) }, { projection: { community_id: 1 } }).toArray()
    ])

    console.log('joined:::', joined)

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
          from: 'community-pin',
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

  async getOneBareInfoBySlug({ slug, user_id }: { slug: string; user_id: string }): Promise<ICommunity> {
    const community = await CommunityCollection.aggregate<CommunitySchema>([
      // match slug
      {
        $match: { slug }
      },

      // lookup admin info
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

      // check if user follows admin
      {
        $lookup: {
          from: 'followers',
          let: { targetUserId: '$admin._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$followed_user_id', '$$targetUserId'] }, { $eq: ['$user_id', new ObjectId(user_id)] }]
                }
              }
            }
          ],
          as: 'userFollowCheck'
        }
      },

      // lookup members count
      {
        $lookup: {
          from: 'community-member',
          let: { communityId: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$community_id', '$$communityId'] } } }, { $count: 'count' }],
          as: 'membersCount'
        }
      },

      // lookup mentors count
      {
        $lookup: {
          from: 'community-mentor',
          let: { communityId: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$community_id', '$$communityId'] } } }, { $count: 'count' }],
          as: 'mentorsCount'
        }
      },

      // add fields
      {
        $addFields: {
          'admin.isFollow': { $gt: [{ $size: '$userFollowCheck' }, 0] },
          member_count: {
            $add: [
              { $ifNull: [{ $arrayElemAt: ['$membersCount.count', 0] }, 0] },
              { $ifNull: [{ $arrayElemAt: ['$mentorsCount.count', 0] }, 0] },
              1 // admin
            ]
          }
        }
      },

      // remove unnecessary fields
      {
        $project: {
          userFollowCheck: 0,
          membersCount: 0,
          mentorsCount: 0
        }
      }
    ]).next()

    if (!community) {
      throw new NotFoundError(`Không tìm thấy cộng đồng với slug ${slug}`)
    }

    return community
  }

  // Lấy chi tiết members và mentors
  async getMMById(id: string, user_id: string): Promise<ICommunity> {
    const userObjId = new ObjectId(user_id)
    const communityObjId = new ObjectId(id)

    const community = await CommunityCollection.aggregate<CommunitySchema>([
      // match id
      { $match: { _id: communityObjId } },

      // mentors list
      {
        $lookup: {
          from: 'community-mentor',
          localField: '_id',
          foreignField: 'community_id',
          as: 'mentors',
          pipeline: [
            {
              $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'user',
                pipeline: [
                  {
                    $lookup: {
                      from: 'followers',
                      let: { targetUserId: '$_id' },
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $and: [{ $eq: ['$followed_user_id', '$$targetUserId'] }, { $eq: ['$user_id', userObjId] }]
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

      // members list
      {
        $lookup: {
          from: 'community-member',
          localField: '_id',
          foreignField: 'community_id',
          as: 'members',
          pipeline: [
            {
              $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'user',
                pipeline: [
                  {
                    $lookup: {
                      from: 'followers',
                      let: { targetUserId: '$_id' },
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $and: [{ $eq: ['$followed_user_id', '$$targetUserId'] }, { $eq: ['$user_id', userObjId] }]
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

      {
        $project: {
          members: 1,
          mentors: 1
        }
      }
    ]).next()

    if (!community) {
      throw new NotFoundError(`Không tìm thấy cộng đồng với id ${id}`)
    }

    return community
  }

  async inviteMembers({ user_id, payload }: { user_id: string; payload: InvitationMembersDto }) {
    await CommunityInvitationService.invite({
      user_id,
      payload
    })
    return true
  }

  async togglePin({ user_id, community_id }: { user_id: string; community_id: string }) {
    const userObjectId = new ObjectId(user_id)
    const communityObjectId = new ObjectId(community_id)

    const dataHandle = {
      user_id: userObjectId,
      community_id: communityObjectId
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
}

export default new CommunityService()
