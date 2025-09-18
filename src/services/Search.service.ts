import { ObjectId } from 'mongodb'
import { SearchSuggestCollection, SearchSuggestSchema } from '~/models/schemas/SearchSuggest.schema'
import { TweetCollection, TweetSchema } from '~/models/schemas/Tweet.schema'
import { UserCollection, UserSchema } from '~/models/schemas/User.schema'
import { BadRequestError } from '~/shared/classes/error.class'
import { ResSearchPending } from '~/shared/dtos/res/search.dto'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { EMediaType, ETweetType } from '~/shared/enums/type.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ISearchSuggest } from '~/shared/interfaces/schemas/searchSuggest.interface'
import { ITweet } from '~/shared/interfaces/schemas/tweet.interface'
import { IUser } from '~/shared/interfaces/schemas/user.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'
import FollowsService from './Follows.service'
import HashtagsService from './Hashtags.service'

class SearchService {
  private async create(text: string) {
    let _hashtag = undefined
    if (text.includes('#')) {
      const [_id] = await HashtagsService.checkHashtags([text.replace('#', '').trim()])
      _hashtag = _id
    }

    // tìm document theo text hoặc hashtag
    const query: any = {
      $or: []
    }

    if (text) query.$or.push({ text })
    if (_hashtag) query.$or.push({ hashtag: _hashtag })

    // nếu không có text và hashtag => throw
    if (query.$or.length === 0) {
      throw new BadRequestError('Payload phải có ít nhất text hoặc hashtag')
    }

    const result = await SearchSuggestCollection.findOneAndUpdate(
      query,
      {
        $setOnInsert: { text, hashtag: _hashtag },
        $inc: { searchCount: 1 } // tăng nếu tìm thấy
      },
      { upsert: true, returnDocument: 'after' }
    )

    return result
  }

  // Sử dụng cho card what happen (từ khoá hay hashtag tìm kiếm nhiều nhất)
  async getTrending({ query }: { query: IQuery<ISearchSuggest> }): Promise<ResMultiType<ISearchSuggest>> {
    const { skip, limit } = getPaginationAndSafeQuery<ISearchSuggest>(query)

    const search = await SearchSuggestCollection.aggregate<SearchSuggestSchema>([
      {
        $lookup: {
          from: 'hashtags',
          localField: 'hashtag',
          foreignField: '_id',
          as: 'hashtag',
          pipeline: [
            {
              $project: {
                name: 1
              }
            }
          ]
        }
      },
      { $unwind: { path: '$hashtag', preserveNullAndEmptyArrays: true } },
      { $sort: { searchCount: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]).toArray()

    const total = await SearchSuggestCollection.countDocuments()

    return { total, total_page: Math.ceil(total / limit), items: search }
  }

  //
  async searchPending({ query }: { query: IQuery<ISearchSuggest> }): Promise<ResSearchPending> {
    const { skip, limit, sort, q } = getPaginationAndSafeQuery<ISearchSuggest>(query)

    let _hashtag = undefined
    if (q.includes('#')) {
      const [_id] = await HashtagsService.checkHashtags([q])
      _hashtag = _id
    }

    const search = await SearchSuggestCollection.aggregate<SearchSuggestSchema>([
      {
        $match: {
          $or: [{ text: q }, { hashtag: _hashtag }]
        }
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit }
    ]).toArray()

    const users = await UserCollection.aggregate<UserSchema>([
      {
        $match: {
          $or: [{ name: q }, { username: q }]
        }
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit }
    ]).toArray()

    return { search, users }
  }

  // Sử dụng cho thanh tìm kiếm search
  async searchTweet({ query, user_id }: { query: IQuery<ITweet>; user_id: string }): Promise<ResMultiType<ITweet>> {
    //
    const { skip, limit, q, f, pf, sort } = getPaginationAndSafeQuery<ITweet>(query)

    //
    const followed_user_ids = await FollowsService.getUserFollowers(user_id)

    //
    const hasQ = { query: {}, projection: {}, sort: {}, score: {} }
    const hasF = { query: {} }
    const hasPf = {
      query: {}
    }

    //
    if (q) {
      hasQ.query = {
        $text: { $search: q }
      }
      hasQ.projection = {
        score: { $meta: 'textScore' }
      }
      hasQ.sort = {
        score: { $meta: 'textScore' },
        created_at: -1
      }
      hasQ.score = { score: { $meta: 'textScore' } }
    } else {
      hasQ.sort = sort
    }

    //
    if (!Number.isNaN(f)) {
      hasF.query = {
        'media.type': {
          $or: [EMediaType.Image, EMediaType.Video]
        }
      }
    }

    //
    if (pf) {
      hasPf.query = { user_id: { $in: followed_user_ids } }
    } else {
      hasPf.query = {
        $or: [
          {
            audience: ETweetAudience.Everyone
          },
          {
            $and: [
              {
                audience: ETweetAudience.Followers
              },
              {
                user_id: {
                  $in: followed_user_ids
                }
              }
            ]
          }
        ]
      }
    }

    //
    const tweets = await TweetCollection.aggregate<TweetSchema>([
      {
        $match: {
          ...hasQ.query,
          ...hasF.query,
          ...hasPf.query
        }
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
          localField: 'user_id',
          foreignField: '_id',
          as: 'user_id',
          pipeline: [
            {
              $project: {
                name: 1,
                email: 1,
                username: 1,
                avatar: 1,
                cover_photo: 1
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
        $lookup: {
          from: 'hashtags',
          localField: 'hashtags',
          foreignField: '_id',
          as: 'hashtags',
          pipeline: [
            {
              $project: {
                name: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'mentions',
          foreignField: '_id',
          as: 'mentions',
          pipeline: [
            {
              $project: {
                name: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'bookmarks',
          localField: '_id',
          foreignField: 'tweet_id',
          as: 'bookmarks',
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
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'tweet_id',
          as: 'likes',
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
        $lookup: {
          from: 'tweets',
          localField: '_id',
          foreignField: 'parent_id',
          as: 'tweets_children'
        }
      },
      {
        $addFields: {
          bookmark_count: { $size: '$bookmarks' },
          like_count: { $size: '$likes' },
          // mentions: {
          //   $map: {
          //     input: '$mentions',
          //     as: 'm',
          //     in: {
          //       _id: '$m._id',
          //       name: '$m.name',
          //       username: '$m.username'
          //     }
          //   }
          // },
          retweet: {
            $size: {
              $filter: {
                input: '$tweets_children',
                as: 'tweet',
                cond: {
                  $eq: ['$$tweet.type', ETweetType.Retweet]
                }
              }
            }
          },
          comment_count: {
            $size: {
              $filter: {
                input: '$tweets_children',
                as: 'tweet',
                cond: {
                  $eq: ['$$tweet.type', ETweetType.Comment]
                }
              }
            }
          },
          quote_count: {
            $size: {
              $filter: {
                input: '$tweets_children',
                as: 'tweet',
                cond: {
                  $eq: ['$$tweet.type', ETweetType.QuoteTweet]
                }
              }
            }
          },
          ...hasQ.score
        }
      },
      {
        $sort: hasQ.sort
      }
    ]).toArray()

    // Increase views
    const ids = tweets.map((tweet) => tweet._id as ObjectId)
    const date = new Date()

    //
    const [total] = await Promise.all([
      TweetCollection.countDocuments({
        ...hasQ.query,
        ...hasF.query,
        ...hasPf.query
      }),
      TweetCollection.updateMany(
        {
          _id: {
            $in: ids
          }
        },
        {
          $inc: { user_view: 1 },
          $set: {
            updated_at: date
          }
        }
      )
    ])

    // Cập nhật lại searchSuggest
    await this.create(q)

    //
    return { total, total_page: Math.ceil(total / limit), items: tweets }
  }

  // Sử dụng cho thanh tìm kiếm search
  async searchUser({ query, user_id }: { query: IQuery<ITweet>; user_id: string }): Promise<ResMultiType<IUser>> {
    //
    const { skip, limit, q, f, pf, sort } = getPaginationAndSafeQuery<IUser>(query)

    //
    const users = await UserCollection.aggregate<UserSchema>([{}]).toArray()

    const total = await UserCollection.countDocuments({})

    return { total, total_page: Math.ceil(total / limit), items: users }
  }
}

export default new SearchService()
