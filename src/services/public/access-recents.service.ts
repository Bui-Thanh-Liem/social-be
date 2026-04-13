import { ObjectId } from 'mongodb'
import { BadRequestError } from '~/core/error.response'
import { CreateAccessRecentDto } from '~/shared/dtos/public/access-recents.dto'
import { IAccessRecent } from '~/shared/interfaces/public/access-recent.interface'
import { AccessRecentCollection, AccessRecentSchema } from '~/models/public/access-recent.schema'
import { COLLECTION_COMMUNITIES_NAME } from '~/models/public/community.schema'
import { COLLECTION_TWEETS_NAME } from '~/models/public/tweet.schema'
import { COLLECTION_USERS_NAME } from '~/models/public/user.schema'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'

class AccessRecentService {
  async create(body: CreateAccessRecentDto) {
    const { ref_id, user_id, ref_slug } = body
    const refIdObjectId = new ObjectId(ref_id)
    const userIdObjectId = new ObjectId(user_id)

    // Nếu không có user_id (trường hợp guest), không lưu truy cập gần đây
    if (!user_id || user_id === ref_id) return

    //
    const exists = await AccessRecentCollection.findOne({
      ref_id: refIdObjectId,
      user_id: userIdObjectId
    })
    if (exists) return

    const newBadWord = await AccessRecentCollection.insertOne(
      new AccessRecentSchema({
        type: body.type,
        ref_slug: ref_slug,
        ref_id: refIdObjectId,
        user_id: userIdObjectId
      })
    )
    return newBadWord
  }

  async getMulti(user_id: string, query: IQuery<IAccessRecent>) {
    const { skip, limit, sort } = getPaginationAndSafeQuery<IAccessRecent>(query)

    //
    const [accessRecent, total] = await Promise.all([
      AccessRecentCollection.aggregate<any>([
        { $match: { user_id: new ObjectId(user_id) } },

        { $sort: sort },
        { $skip: skip },
        { $limit: limit },

        // 1. Lookup cho User
        {
          $lookup: {
            from: COLLECTION_USERS_NAME,
            localField: 'ref_id',
            foreignField: '_id',
            as: 'user_data',
            pipeline: [{ $project: { username: 1, avatar: 1, name: 1 } }]
          }
        },
        // 2. Lookup cho Community
        {
          $lookup: {
            from: COLLECTION_COMMUNITIES_NAME,
            localField: 'ref_id',
            foreignField: '_id',
            as: 'community_data',
            pipeline: [{ $project: { name: 1, slug: 1, cover: 1 } }]
          }
        },
        // 3. Lookup cho Tweet
        {
          $lookup: {
            from: COLLECTION_TWEETS_NAME,
            localField: 'ref_id',
            foreignField: '_id',
            as: 'tweet_data',
            pipeline: [{ $project: { medias: 1, _id: 1 } }]
          }
        },

        // 4. Hợp nhất kết quả dựa trên 'type'
        {
          $addFields: {
            detail: {
              $switch: {
                branches: [
                  { case: { $eq: ['$type', 'user'] }, then: { $arrayElemAt: ['$user_data', 0] } },
                  { case: { $eq: ['$type', 'community'] }, then: { $arrayElemAt: ['$community_data', 0] } },
                  { case: { $eq: ['$type', 'tweet'] }, then: { $arrayElemAt: ['$tweet_data', 0] } }
                ],
                default: null
              }
            }
          }
        },

        // 5. Dọn dẹp các trường tạm (optional)
        {
          $project: {
            user_data: 0,
            tweet_data: 0,
            community_data: 0
          }
        }
      ]).toArray(),
      AccessRecentCollection.countDocuments({})
    ])

    //
    return { total, total_page: Math.ceil(total / limit), items: accessRecent }
  }

  async delete({ id }: { id: string }) {
    const deleted = await AccessRecentCollection.findOneAndDelete({ _id: new ObjectId(id) })

    if (!deleted?._id) {
      throw new BadRequestError('Xóa truy cập gần đây thất bại')
    }

    return Boolean(deleted?._id)
  }

  async deleteAll({ user_id }: { user_id: string }) {
    const deleted = await AccessRecentCollection.deleteMany({ user_id: new ObjectId(user_id) })

    if (!deleted.deletedCount) {
      throw new BadRequestError('Xóa tất cả truy cập gần đây thất bại')
    }

    return Boolean(deleted.deletedCount)
  }
}

export default new AccessRecentService()
