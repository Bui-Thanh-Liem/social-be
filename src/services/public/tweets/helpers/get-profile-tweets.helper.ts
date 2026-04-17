import { ETweetAudience, ETweetStatus, ETweetType } from '~/shared/enums/public/tweets.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ITweet } from '~/shared/interfaces/public/tweet.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import followsService from '../../follows.service'
import { ObjectId } from 'mongodb'
import { COLLECTION_TWEETS_NAME, TweetsCollection, TweetsSchema } from '~/models/public/tweet.schema'
import { COLLECTION_LIKES_NAME } from '~/models/public/like.schema'
import { COLLECTION_USERS_NAME } from '~/models/public/user.schema'
import { EUserStatus } from '~/shared/enums/public/users.enum'
import { COLLECTION_COMMUNITIES_NAME } from '~/models/public/community.schema'
import { COLLECTION_BOOKMARKS_NAME } from '~/models/public/bookmark.schema'
import tweetsService from '../tweets.service'

export async function getProfileTweetsHelper({
  query,
  user_id,
  isMedia,
  tweet_type,
  isHighlight,
  user_active_id
}: {
  user_id: string
  isMedia?: boolean
  query: IQuery<ITweet>
  isHighlight?: boolean
  tweet_type: ETweetType
  user_active_id: string
}): Promise<ResMultiType<ITweet>> {
  //
  let { skip, limit, sort } = getPaginationAndSafeQuery<ITweet>(query)

  // Lấy danh sách của người nào đang theo dõi user_id
  const followed_user_ids = await followsService.getUserFollowers(user_id)

  // ép về string để so sánh cho chắc
  const is_following = followed_user_ids.some((f: ObjectId | string) => f.toString() === user_active_id?.toString())

  //
  const match_condition: any = {
    user_id: new ObjectId(user_id),
    type: tweet_type === ETweetType.Retweet ? { $in: [ETweetType.Retweet, ETweetType.QuoteTweet] } : tweet_type
  }

  // Nếu người xem profile là chính chủ
  if (user_active_id === user_id) {
    match_condition.audience = { $in: [ETweetAudience.Everyone, ETweetAudience.Followers, ETweetAudience.Mentions] }
  } else {
    // Nếu người khác xem profile
    match_condition.$or = [
      { audience: ETweetAudience.Everyone },
      ...(is_following ? [{ audience: ETweetAudience.Followers }] : [])
    ]

    // Nếu là người khác xem profile của mình thì không cho thấy
    match_condition.community_id = { $eq: null }

    // Chỉ hiển thị những bài viết đã được duyệt
    match_condition.status = ETweetStatus.Ready
  }

  //
  if (isMedia) {
    match_condition['medias.0'] = { $exists: true }
  }

  //
  if (isHighlight) {
    skip = 0
    limit = 20
    sort = { likes_count: -1, total_views: -1 } // Sắp xếp theo likes_count, sau đó total_views
  }

  // Pipeline tổng hợp
  const tweets = await TweetsCollection.aggregate<TweetsSchema>([
    {
      $match: match_condition
    },

    // --- BƯỚC THÊM MỚI: Kiểm tra status người dùng ---
    {
      $lookup: {
        from: COLLECTION_USERS_NAME,
        localField: 'user_id',
        foreignField: '_id',
        as: 'author'
      }
    },
    {
      $unwind: '$author'
    },
    {
      $match: {
        $or: [{ 'author._id': new ObjectId(user_active_id) }, { 'author.status.status': { $ne: EUserStatus.Hidden } }]
      }
    },
    // ----------------------------------------------

    // tính total_views nếu cần (ok để trước sort)
    ...(isHighlight
      ? [
          {
            $addFields: {
              total_views: { $add: ['$user_view', '$guest_view'] }
            }
          }
        ]
      : []),

    // --- IMPORTANT: lookup likes trước sort để có likes_count ---
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
      $addFields: { likes_count: { $size: '$likes' } }
    },

    // bây giờ sort sẽ hoạt động đúng vì likes_count đã có
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
      $lookup: {
        from: COLLECTION_COMMUNITIES_NAME,
        localField: 'community_id',
        foreignField: '_id',
        as: 'community_id',
        pipeline: [
          {
            $project: {
              name: 1,
              slug: 1
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
      $unwind: {
        path: '$community_id',
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
      $project: {
        userFollowCheck: 0 // xoá field tạm
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

  // Increase views
  const ids = tweets.map((tweet) => tweet._id as ObjectId)
  const date = new Date()

  const [total] = await Promise.all([
    TweetsCollection.countDocuments(match_condition),
    TweetsCollection.updateMany(
      {
        _id: { $in: ids }
      },
      {
        $inc: { user_view: 1 },
        $set: { updated_at: date }
      }
    )
  ])

  //
  tweets.forEach((tweet) => {
    tweet.updated_at = date
    if (user_active_id) {
      tweet.user_view += 1
    } else {
      tweet.guest_view += 1
    }
  })

  console.log('tweets after update view: ', tweets)

  return {
    total,
    total_page: Math.ceil(total / limit),
    items: tweetsService.signedCloudfrontMediaUrls(tweets) as TweetsSchema[]
  }
}
