import { ObjectId } from 'mongodb'
import { COLLECTION_BOOKMARKS_NAME } from '~/models/public/bookmark.schema'
import { COLLECTION_LIKES_NAME, LikesCollection } from '~/models/public/like.schema'
import { COLLECTION_TWEETS_NAME, TweetsCollection, TweetsSchema } from '~/models/public/tweet.schema'
import { COLLECTION_USERS_NAME } from '~/models/public/user.schema'
import { ETweetType } from '~/shared/enums/public/tweets.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import tweetsService from '../tweets.service'

export async function getTweetLikedHelper({
  query,
  user_active_id
}: {
  user_active_id: string
  query: IQuery<TweetsSchema>
}): Promise<ResMultiType<TweetsSchema>> {
  // Phân trang và truy vấn an toàn
  const { skip, limit, sort, q } = getPaginationAndSafeQuery<TweetsSchema>(query)

  // Lấy danh sách tweet_id mà user_id đã like
  const likedTweetIds = await LikesCollection.distinct('tweet_id', {
    user_id: new ObjectId(user_active_id)
  })

  // Điều kiện lọc tweet
  const match_condition: any = {
    _id: { $in: likedTweetIds } // Chỉ lấy tweet đã like
  }

  //
  if (q) {
    match_condition.$text = { $search: q }
  }

  // Pipeline tổng hợp
  const tweets = await TweetsCollection.aggregate<TweetsSchema>([
    {
      $match: match_condition
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
        from: COLLECTION_USERS_NAME,
        localField: 'user_id',
        foreignField: '_id',
        as: 'user_id',
        pipeline: [
          {
            $project: {
              bio: 1,
              name: 1,
              email: 1,
              username: 1,
              avatar: 1,
              verify: 1,
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
    // lookup để kiểm tra user hiện tại có follow user_id không
    {
      $lookup: {
        from: 'followers',
        let: { target_user_id: '$user_id._id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$followed_user_id', '$$target_user_id'] },
                  { $eq: ['$user_id', new ObjectId(user_active_id)] }
                ]
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
        from: COLLECTION_USERS_NAME,
        localField: 'mentions',
        foreignField: '_id',
        as: 'mentions',
        pipeline: [
          {
            $project: {
              name: 1,
              username: 1,
              avatar: 1,
              verify: 1,
              bio: 1
            }
          }
        ]
      }
    },
    {
      $lookup: {
        from: COLLECTION_BOOKMARKS_NAME,
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
        from: COLLECTION_LIKES_NAME,
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
        from: COLLECTION_TWEETS_NAME,
        localField: '_id',
        foreignField: 'parent_id',
        as: 'tweets_children'
      }
    },
    {
      $addFields: {
        // bookmarks_count: { $size: '$bookmarks' },
        likes_count: { $size: '$likes' },
        is_like: {
          $in: [new ObjectId(user_active_id), '$likes.user_id']
        },
        is_bookmark: {
          $in: [new ObjectId(user_active_id), '$bookmarks.user_id']
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
                      { $eq: ['$$child.user_id', new ObjectId(user_active_id)] }
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
    }
  ]).toArray()

  // Tăng số lượt xem
  const ids = tweets.map((tweet) => tweet._id as ObjectId)
  const date = new Date()

  const [total] = await Promise.all([
    TweetsCollection.countDocuments(match_condition),
    ids.length > 0
      ? TweetsCollection.updateMany(
          {
            _id: { $in: ids }
          },
          {
            $inc: { user_view: 1 },
            $set: { updated_at: date }
          }
        )
      : Promise.resolve()
  ])

  // Cập nhật views trong kết quả trả về
  tweets.forEach((tweet) => {
    tweet.updated_at = date
    if (user_active_id) {
      tweet.user_view = (tweet.user_view || 0) + 1
    } else {
      tweet.guest_view = (tweet.guest_view || 0) + 1
    }
  })

  return {
    total,
    total_page: Math.ceil(total / limit),
    items: tweetsService.signedCloudfrontMediaUrls(tweets) as TweetsSchema[]
  }
}
