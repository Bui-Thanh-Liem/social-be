import { ObjectId } from 'mongodb'
import { CreateSearchHistoryDto } from '~/dtos/search-history.dto'
import { IUser } from '~/interfaces/users.interface'
import { COLLECTION_COMMUNITIES_NAME } from '~/models/communities.schema'
import { SearchHistoryCollection, SearchHistorySchema } from '~/models/search-history.schema'
import { COLLECTION_USER_NAME } from '~/models/users.schema'
import { IQuery } from '~/shared/interfaces/query.interface'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import { ESourceViolation } from '../enums/user-violations.enum'
import { ISearchHistory } from '../interfaces/search-history.interface'
import BadWordsService from './bad-words.service'
import UserViolationsService from './user-violations.service'

class SearchHistoryService {
  async create({ payload, user_active }: { payload: CreateSearchHistoryDto; user_active: IUser }) {
    const { user, trending, community, text } = payload

    // Lọc từ cấm trong text khi tạo search history
    const _text = await BadWordsService.detectInText({
      text: text || '',
      user_id: user_active?._id!.toString()
    })

    const query: any = {
      owner: user_active?._id
    }

    if (text) query.text = text
    if (user) query.user = new ObjectId(user)
    if (trending) query.trending = new ObjectId(trending)
    if (community) query.community = new ObjectId(community)

    // Nếu không có field nào ngoài owner thì không cho tạo
    if (Object.keys(query).length === 1) return false

    // Kiểm tra đã tồn tại hay chưa
    const exists = await SearchHistoryCollection.findOne(query)
    if (exists) return true

    const created = await SearchHistoryCollection.insertOne(
      new SearchHistorySchema({
        owner: user_active?._id,
        text: _text.text || undefined,
        user: user ? new ObjectId(user) : undefined,
        trending: trending ? new ObjectId(trending) : undefined,
        community: community ? new ObjectId(community) : undefined
      })
    )

    // Lưu vi phạm từ cấm nếu có (rabbitmq)
    if (_text.bad_words_ids.length > 0) {
      await UserViolationsService.create({
        user_id: user_active?._id!.toString(),
        source_id: created.insertedId.toString(),
        source: ESourceViolation.SearchHistory,
        final_content: _text.matched_words.join() || '',
        bad_word_ids: _text.bad_words_ids
      })
    }

    return !!created.insertedId
  }

  async getMulti({ queries, user_active }: { queries: IQuery<ISearchHistory>; user_active: IUser }) {
    const { skip, limit, sort } = getPaginationAndSafeQuery<ISearchHistory>(queries)

    const pipeline: any[] = [
      { $match: { owner: user_active?._id } },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: COLLECTION_USER_NAME,
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
      {
        $lookup: {
          from: COLLECTION_COMMUNITIES_NAME,
          localField: 'community',
          foreignField: '_id',
          as: 'community',
          pipeline: [{ $project: { name: 1, slug: 1, cover: 1, category: 1 } }]
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$trending', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$community', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          text: 1,
          user: 1,
          trending: 1,
          community: 1
        }
      }
    ]

    const history = await SearchHistoryCollection.aggregate<SearchHistorySchema>(pipeline).toArray()
    const total = await SearchHistoryCollection.countDocuments({ owner: user_active?._id })

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
