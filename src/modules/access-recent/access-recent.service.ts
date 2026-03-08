import { ObjectId } from 'mongodb'
import { IQuery } from '~/shared/interfaces/query.interface'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import { COLLECTION_COMMUNITIES_NAME } from '../communities/communities.schema'
import { COLLECTION_TWEET_NAME } from '../tweets/tweets.schema'
import { COLLECTION_USER_NAME } from '../users/users.schema'
import { CreateAccessRecentDto } from './access-recent.dto'
import { IAccessRecent } from './access-recent.interface'
import { AccessRecentCollection, AccessRecentSchema } from './access-recent.schema'

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

  async getMulti(query: IQuery<IAccessRecent>) {
    const { skip, limit, sort } = getPaginationAndSafeQuery<IAccessRecent>(query)

    //
    const [accessRecent, total] = await Promise.all([
      AccessRecentCollection.aggregate<any>([
        // Ép kiểu any hoặc tạo interface mở rộng
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },

        // 1. Lookup cho User
        {
          $lookup: {
            from: COLLECTION_USER_NAME,
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
            from: COLLECTION_TWEET_NAME,
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

  async delete({ access_recent_id }: { access_recent_id: string }) {
    const deletedAccessRecent = await AccessRecentCollection.findOneAndDelete({ _id: new ObjectId(access_recent_id) })
    return deletedAccessRecent
  }

  async deleteAll({ user_id }: { user_id: string }) {
    return await AccessRecentCollection.deleteMany({ user_id: new ObjectId(user_id) })
  }
}

export default new AccessRecentService()
