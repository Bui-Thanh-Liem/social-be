import { ObjectId } from 'mongodb'
import { SearchHistoryCollection, SearchHistorySchema } from '~/models/schemas/SearchHistory.schema'
import { CreateSearchHistoryDto } from '~/shared/dtos/req/search-history.dto'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ISearchHistory } from '~/shared/interfaces/schemas/search-history.interface'
import { IUser } from '~/shared/interfaces/schemas/user.interface'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'

class SearchHistoryService {
  async create({ payload, user_active }: { payload: CreateSearchHistoryDto; user_active: IUser }) {
    const { user, trending, text } = payload

    const query: any = {
      owner: user_active._id
    }

    if (text) query.text = text
    if (user) query.user = new ObjectId(user)
    if (trending) query.trending = new ObjectId(trending)

    // Nếu không có field nào ngoài owner thì không cho tạo
    if (Object.keys(query).length === 1) return false

    // Kiểm tra đã tồn tại hay chưa
    const existed = await SearchHistoryCollection.findOne(query)
    if (existed) return true

    const created = await SearchHistoryCollection.insertOne(
      new SearchHistorySchema({
        owner: user_active._id,
        text: text || undefined,
        user: user ? new ObjectId(user) : undefined,
        trending: trending ? new ObjectId(trending) : undefined
      })
    )

    return !!created.insertedId
  }

  async getMulti({ queries, user_active }: { queries: IQuery<ISearchHistory>; user_active: IUser }) {
    const { skip, limit, sort } = getPaginationAndSafeQuery<ISearchHistory>(queries)

    const pipeline: any[] = [
      { $match: { owner: user_active._id } },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { name: 1, username: 1, avatar: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'trending',
          localField: 'trending',
          foreignField: '_id',
          as: 'trending',
          pipeline: [{ $project: { topic: 1, hashtag: 1 } }]
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$trending', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          text: 1,
          user: 1,
          trending: 1
        }
      }
    ]

    const history = await SearchHistoryCollection.aggregate<SearchHistorySchema>(pipeline).toArray()
    const total = await SearchHistoryCollection.countDocuments({ owner: user_active._id })

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: history
    }
  }

  async delete(id: string) {
    await SearchHistoryCollection.deleteOne({ _id: new ObjectId(id) })
    return true
  }
}

export default new SearchHistoryService()
