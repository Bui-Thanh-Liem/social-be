import { ObjectId } from 'mongodb'
import { CommunityCollection, CommunitySchema } from '~/models/schemas/Community.schema'
import { BadRequestError, ConflictError, NotFoundError } from '~/shared/classes/error.class'
import { AddMembersDto, CreateCommunityDto } from '~/shared/dtos/req/community.dto'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ICommunity } from '~/shared/interfaces/schemas/community.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'
import { slug } from '~/utils/slug.util'

class CommunityService {
  async create(user_id: string, payload: CreateCommunityDto): Promise<ICommunity> {
    const exists = await CommunityCollection.countDocuments({ slug: slug(payload.name) })

    if (exists) {
      throw new ConflictError('Tên cộng đồng này đã được sử dụng.')
    }

    const inserted = await CommunityCollection.insertOne(
      new CommunitySchema({ ...payload, admin: new ObjectId(user_id) })
    )

    const community = await CommunityCollection.findOne({ _id: inserted.insertedId })

    if (!community) {
      throw new BadRequestError('Có lỗi trong quá trình tạo Cộng Đồng.')
    }

    return community
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

  //
  async addMembers({ user_id, payload }: { user_id: string; payload: AddMembersDto }) {
    const { member_ids, community_id } = payload
  }
}

export default new CommunityService()
