import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ITweet } from '~/shared/interfaces/public/tweet.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import followsService from '../../follows.service'
import { Filter, ObjectId } from 'mongodb'
import { ETweetAudience, ETweetStatus, ETweetType } from '~/shared/enums/public/tweets.enum'
import { COLLECTION_TWEETS_NAME, TweetsCollection, TweetsSchema } from '~/schemas/public/tweet.schema'
import { COLLECTION_LIKES_NAME } from '~/schemas/public/like.schema'
import { COLLECTION_USERS_NAME } from '~/schemas/public/user.schema'
import { COLLECTION_BOOKMARKS_NAME } from '~/schemas/public/bookmark.schema'
import tweetsService from '../tweets.service'

export async function getTweetsByCommunityIdHelper({
  query,
  isMedia,
  isHighlight,
  community_id,
  user_active_id
}: {
  isMedia?: boolean
  community_id: string
  query: IQuery<ITweet>
  isHighlight?: boolean
  user_active_id: string
}): Promise<ResMultiType<ITweet>> {
  //
  // eslint-disable-next-line prefer-const
  let { skip, limit, sort, q } = getPaginationAndSafeQuery<ITweet>(query)

  // Lấy danh sách của người nào đang theo dõi user_id
  const following_user_ids = await followsService.getUserFollowing(user_active_id)

  //
  const match_condition = {
    community_id: new ObjectId(community_id),
    status: ETweetStatus.Ready,
    $or: [
      { audience: ETweetAudience.Everyone },
      ...(following_user_ids.length
        ? [{ audience: ETweetAudience.Followers, user_id: { $in: following_user_ids } }]
        : [])
    ]
  } as Filter<TweetsSchema>

  //
  if (q) {
    match_condition.$text = { $search: q }
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
        mentions: {
          $map: {
            input: '$mentions',
            as: 'm',
            in: {
              _id: '$m._id',
              name: '$m.name',
              username: '$m.username'
            }
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

  return {
    total,
    total_page: Math.ceil(total / limit),
    items: tweetsService.signedCloudfrontMediaUrls(tweets) as TweetsSchema[]
  }
}
