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
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ICommunity } from '~/shared/interfaces/schemas/community.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'
import { slug } from '~/utils/slug.util'
import CommunityInvitationService from './Community-invitation.service'

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

  async getOneBySlug(slug: string, user_id: string): Promise<ICommunity> {
    const community = await CommunityCollection.aggregate<CommunitySchema>([
      {
        $match: {
          slug: slug
        }
      },
      {
        $lookup: {
          from: 'followers',
          localField: 'admin',
          foreignField: 'followed_user_id',
          as: 'followers'
        }
      },
      {
        $lookup: {
          from: 'followers',
          let: { targetUserId: 'admin' },
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
      // lookup để kiểm tra user hiện tại có follow user_id không
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
      {
        $addFields: {
          'user_id.isFollow': { $gt: [{ $size: '$userFollowCheck' }, 0] }
        }
      }
    ]).next()

    console.log('community):::', community)

    if (!community) {
      throw new NotFoundError(`Không tìm thấy cộng đồng với slug ${slug}`)
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

  async togglePinCommunity({ user_id, community_id }: { user_id: string; community_id: string }) {
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
