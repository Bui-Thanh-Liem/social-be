import { ObjectId } from 'mongodb'
import { FollowerCollection } from '~/models/schemas/Follower.schema'
import { TweetCollection, TweetSchema } from '~/models/schemas/Tweet.schema'
import { CreateTweetDto } from '~/shared/dtos/req/tweet.dto'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { EFeedType, ETweetType } from '~/shared/enums/type.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ITweet } from '~/shared/interfaces/schemas/tweet.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'
import HashtagsService from './Hashtags.service'

class TweetsService {
  async create(user_id: string, payload: CreateTweetDto) {
    const { audience, type, content, parent_id, mentions, medias } = payload
    const hashtags = await HashtagsService.checkHashtags(payload.hashtags)

    const result = await TweetCollection.insertOne(
      new TweetSchema({
        user_id: new ObjectId(user_id),
        type: type,
        audience: audience,
        hashtags: hashtags,
        content: content,
        parent_id: parent_id ? new ObjectId(parent_id) : null,
        mentions: mentions ? mentions?.map((id) => new ObjectId(id)) : [],
        medias: medias
      })
    )
    return result
  }

  async getOneById(tweet_id: string) {
    const result = await TweetCollection.aggregate<TweetSchema>([
      {
        $match: {
          _id: new ObjectId(tweet_id)
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
          from: 'users', // tên collection chứa user
          localField: 'user_id', // field trong tweet
          foreignField: '_id', // field trong user
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
          path: '$user_id', // chuyển đổi array sang object
          preserveNullAndEmptyArrays: true // nếu user bị xóa vẫn trả về tweet - user_id: null
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
          from: 'bookmarks', // collection chứa bookmark
          localField: '_id', // _id của tweet
          foreignField: 'tweet_id', // field trong bookmark trỏ đến tweet
          as: 'bookmarks', // tên array chứa kết quả
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
        $addFields: {
          bookmark_count: { $size: '$bookmarks' },
          like_count: { $size: '$likes' },
          views: {
            $add: ['$guest_view', '$user_view']
          }
        }
      }
    ]).next()

    return result
  }

  async getTweetChildren({
    query,
    user_id,
    tweet_id,
    tweet_type
  }: {
    tweet_id: string
    query: IQuery<ITweet>
    tweet_type: ETweetType
    user_id: string | undefined
  }): Promise<ResMultiType<ITweet>> {
    const { skip, limit, sort } = getPaginationAndSafeQuery<ITweet>(query)

    //
    const tweets = await TweetCollection.aggregate<TweetSchema>([
      {
        $match: {
          parent_id: new ObjectId(tweet_id),
          type: tweet_type
        }
      },
      {
        $lookup: {
          from: 'hashtags',
          localField: 'hashtags',
          foreignField: '_id',
          as: 'hashtags'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'mentions',
          foreignField: '_id',
          as: 'mentions'
        }
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
          from: 'bookmarks',
          localField: '_id',
          foreignField: 'tweet_id',
          as: 'bookmarks'
        }
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'tweet_id',
          as: 'likes'
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
          views: {
            $add: ['$guest_view', '$user_view']
          },
          mentions: {
            $map: {
              input: '$mentions',
              as: 'm', // alias
              in: {
                _id: '$m._id',
                name: '$m.name',
                email: '$m.email',
                username: '$m.username'
              }
            }
          },
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
          }
        }
      },
      {
        $project: {
          bookmarks: 0, // loại bỏ array bookmarks khỏi kết quả
          likes: 0, // loại bỏ array likes khỏi kết quả
          comments: 0, // loại bỏ array comments khỏi kết quả (chỉ giữ comment_count)
          tweets_children: 0 // chỉ lấy 1 cấp
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
      }
    ]).toArray()

    // Increase views
    const ids = tweets.map((tweet) => tweet._id as ObjectId)
    const inc = user_id ? { user_view: 1 } : { guest_view: 1 }
    const date = new Date()

    //
    const [total] = await Promise.all([
      TweetCollection.countDocuments({
        parent_id: new ObjectId(tweet_id),
        type: tweet_type
      }),

      TweetCollection.updateMany(
        {
          _id: {
            $in: ids
          }
        },
        {
          $inc: inc,
          $set: {
            updated_at: date
          }
        }
      )
    ])

    //
    tweets.forEach((tweet) => {
      tweet.updated_at = date
      if (user_id) {
        tweet.user_view += 1
      } else {
        tweet.guest_view += 1
      }
    })

    return {
      total,
      items: tweets
    }
  }

  async getNewFeeds({
    query,
    user_id,
    feed_type
  }: {
    query: IQuery<ITweet>
    user_id: string
    feed_type: EFeedType
  }): Promise<ResMultiType<ITweet>> {
    //
    const { skip, limit, sort } = getPaginationAndSafeQuery<ITweet>(query)

    // Lấy user đang follow
    const resultFollower = await FollowerCollection.find(
      {
        user_id: new ObjectId(user_id)
      },
      {
        projection: {
          _id: 0,
          followed_user_id: 1
        }
      }
    ).toArray()

    //
    const followed_user_ids = resultFollower.map((x) => x.followed_user_id) as unknown as string[]
    followed_user_ids.push(user_id)

    //
    // Dynamic match condition based on feed type
    let matchCondition: any

    switch (feed_type) {
      case EFeedType.Following:
        // Chỉ tweets following
        matchCondition = {
          user_id: { $in: followed_user_ids }
        }
        break
      case EFeedType.Everyone:
        // Chỉ tweets công khai từ tất cả mọi người
        matchCondition = {
          audience: ETweetAudience.Everyone
        }
        break

      default:
        matchCondition = {
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

    const tweets = await TweetCollection.aggregate<TweetSchema>([
      {
        $match: matchCondition
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
          mentions: {
            $map: {
              input: '$mentions',
              as: 'm', // alias
              in: {
                _id: '$m._id',
                name: '$m.name',
                // email: '$m.email',
                username: '$m.username'
              }
            }
          },
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
          }
        }
      },
      {
        $sort: sort
      }
    ]).toArray()

    // Increase views
    const ids = tweets.map((tweet) => tweet._id as ObjectId)
    const inc = user_id ? { user_view: 1 } : { guest_view: 1 }
    const date = new Date()

    const [total] = await Promise.all([
      TweetCollection.countDocuments(matchCondition),
      TweetCollection.updateMany(
        {
          _id: {
            $in: ids
          }
        },
        {
          $inc: inc,
          $set: {
            updated_at: date
          }
        }
      )
    ])

    //
    tweets.forEach((tweet) => {
      tweet.updated_at = date
      if (user_id) {
        tweet.user_view += 1
      } else {
        tweet.guest_view += 1
      }
    })

    return {
      total,
      items: tweets
    }
  }

  async increaseView(tweet_id: ObjectId, user_id: string | null) {
    const inc = user_id ? { user_view: 1 } : { guest_view: 1 }

    const result = await TweetCollection.findOneAndUpdate(
      {
        _id: tweet_id
      },
      {
        $inc: inc,
        $currentDate: { updated_at: true }
      },
      {
        returnDocument: 'after',
        projection: {
          user_view: 1,
          guest_view: 1,
          updated_at: 1
        }
      }
    )

    return result as Pick<ITweet, 'guest_view' | 'user_view' | 'created_at'>
  }

  async getTweetOnlyUserId(tweet_id: string) {
    return await TweetCollection.aggregate<TweetSchema>([
      {
        $match: { _id: new ObjectId(tweet_id) }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user_id'
        }
      },
      {
        $unwind: '$user_id'
      },
      {
        $project: {
          _id: 1,
          audience: 1,
          user_id: 1
        }
      }
    ]).next()
  }
}

export default new TweetsService()
