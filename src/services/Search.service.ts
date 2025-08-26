import { ObjectId } from 'mongodb'
import { TweetCollection, TweetSchema } from '~/models/schemas/Tweet.schema'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { ETweetType } from '~/shared/enums/type.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ITweet } from '~/shared/interfaces/schemas/tweet.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'
import FollowsService from './Follows.service'

class SearchService {
  async searchTweet({ query, user_id }: { query: IQuery<ITweet>; user_id: string }): Promise<ResMultiType<ITweet>> {
    //
    const { skip, limit, q, f, pf, sort } = getPaginationAndSafeQuery<ITweet>(query)

    //
    const followed_user_ids = await FollowsService.getUserFollowed(user_id)

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
      hasF.query = { 'media.type': f }
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

    return { total, total_page: Math.ceil(total / limit), items: tweets }
  }
}

export default new SearchService()
