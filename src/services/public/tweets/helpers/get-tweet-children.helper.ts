import { ObjectId } from 'mongodb'
import { COLLECTION_BOOKMARKS_NAME } from '~/models/public/bookmark.schema'
import { COLLECTION_LIKES_NAME } from '~/models/public/like.schema'
import { COLLECTION_TWEETS_NAME, TweetsCollection, TweetsSchema } from '~/models/public/tweet.schema'
import { COLLECTION_USERS_NAME } from '~/models/public/user.schema'
import { ETweetStatus, ETweetType } from '~/shared/enums/public/tweets.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ITweet } from '~/shared/interfaces/public/tweet.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import tweetsService from '../tweets.service'

export async function getTweetChildrenHelper({
  id,
  query,
  user_id,
  tweet_type
}: {
  id: string
  query: IQuery<ITweet>
  tweet_type: ETweetType
  user_id: string | undefined
}): Promise<ResMultiType<ITweet>> {
  const { skip, limit, sort } = getPaginationAndSafeQuery<ITweet>(query)

  //
  const tweets = await TweetsCollection.aggregate<TweetsSchema>([
    {
      $match: {
        parent_id: new ObjectId(id),
        type: tweet_type,
        status: ETweetStatus.Ready
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
        from: 'hashtags',
        localField: 'hashtags',
        foreignField: '_id',
        as: 'hashtags'
      }
    },
    {
      $lookup: {
        from: COLLECTION_USERS_NAME,
        localField: 'mentions',
        foreignField: '_id',
        as: 'mentions'
      }
    },
    {
      $lookup: {
        from: COLLECTION_USERS_NAME,
        localField: 'user_id',
        foreignField: '_id',
        as: 'user_id',
        pipeline: [
          {
            $project: {
              avatar: 1,
              bio: 1,
              name: 1,
              username: 1,
              verify: 1,
              cover_photo: 1,
              day_of_birth: 1,
              location: 1,
              website: 1
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
        from: COLLECTION_BOOKMARKS_NAME,
        localField: '_id',
        foreignField: 'tweet_id',
        as: 'bookmarks'
      }
    },
    {
      $lookup: {
        from: COLLECTION_LIKES_NAME,
        localField: '_id',
        foreignField: 'tweet_id',
        as: 'likes'
      }
    },
    {
      $lookup: {
        from: COLLECTION_TWEETS_NAME,
        localField: '_id',
        foreignField: 'parent_id',
        as: 'tweets_children'
      }
    },
    {
      $addFields: {
        bookmark_count: { $size: '$bookmarks' },
        likes_count: { $size: '$likes' },
        is_like: {
          $in: [new ObjectId(user_id), '$likes.user_id']
        },
        is_bookmark: {
          $in: [new ObjectId(user_id), '$bookmarks.user_id']
        },
        // lấy id retweet của user (1 cái đầu tiên hoặc null)
        retweet: {
          $let: {
            vars: {
              matched: {
                $filter: {
                  input: '$tweets_children',
                  as: 'child',
                  cond: {
                    $and: [
                      { $eq: ['$$child.type', ETweetType.Retweet] },
                      { $eq: ['$$child.user_id', new ObjectId(user_id)] }
                    ]
                  }
                }
              }
            },
            in: { $arrayElemAt: ['$$matched._id', 0] }
          }
        },
        // lấy id quote tweet của user (1 cái đầu tiên hoặc null)
        quote: {
          $let: {
            vars: {
              matched: {
                $filter: {
                  input: '$tweets_children',
                  as: 'child',
                  cond: {
                    $and: [
                      { $eq: ['$$child.type', ETweetType.QuoteTweet] },
                      { $eq: ['$$child.user_id', new ObjectId(user_id)] }
                    ]
                  }
                }
              }
            },
            in: { $arrayElemAt: ['$$matched._id', 0] }
          }
        },
        comments_count: {
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
        retweets_count: {
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
        quotes_count: {
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
    }
  ]).toArray()

  // Increase views
  const ids = tweets.map((tweet) => tweet._id as ObjectId)
  const inc = user_id ? { user_view: 1 } : { guest_view: 1 }
  const date = new Date()

  //
  const [total] = await Promise.all([
    TweetsCollection.countDocuments({
      parent_id: new ObjectId(id),
      type: tweet_type
    }),

    TweetsCollection.updateMany(
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
    total_page: Math.ceil(total / limit),
    items: tweetsService.signedCloudfrontMediaUrls(tweets) as TweetsSchema[]
  }
}
