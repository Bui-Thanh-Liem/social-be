import { ObjectId } from 'mongodb'
import { TrendingCollection, TrendingSchema } from '~/models/schemas/Trending.schema'
import { TweetCollection, TweetSchema } from '~/models/schemas/Tweet.schema'
import { UserCollection, UserSchema } from '~/models/schemas/User.schema'
import { ResSearchPending } from '~/shared/dtos/res/search.dto'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { EMediaType, ETweetType } from '~/shared/enums/type.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ITrending } from '~/shared/interfaces/schemas/trending.interface'
import { ITweet } from '~/shared/interfaces/schemas/tweet.interface'
import { IUser } from '~/shared/interfaces/schemas/user.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'
import { slug } from '~/utils/slug.util'
import FollowsService from './Follows.service'
import TrendingService from './Trending.service'
// import HashtagsService from './Hashtags.service'

// Những hàm search sẽ ưu tiên sort sau limit
class SearchService {
  //
  async searchPending({ query }: { query: IQuery<ITrending> }): Promise<ResSearchPending> {
    const { skip, limit, sort, q } = getPaginationAndSafeQuery<ITrending>(query)

    // let _hashtag = undefined
    // if (q.includes('#')) {
    //   const [_id] = await HashtagsService.checkHashtags([q])
    //   _hashtag = _id
    // }

    const trending = await TrendingCollection.aggregate<TrendingSchema>([
      {
        $match: {
          $or: [{ slug: { $regex: slug(q), $options: 'i' } }]
        }
      },
      { $sort: { ...sort, count: -1 } },
      { $skip: skip },
      { $limit: limit },
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
      {
        $project: {
          slug: 1,
          topic: 1,
          hashtag: '$hashtag.name'
        }
      }
    ]).toArray()

    const users = await UserCollection.aggregate<UserSchema>([
      {
        $match: {
          $or: [{ name: { $regex: q, $options: 'i' } }, { username: { $regex: q, $options: 'i' } }]
        }
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          name: 1,
          username: 1,
          avatar: 1,
          verify: 1
        }
      }
    ]).toArray()

    return { trending, users }
  }

  // Sử dụng cho thanh tìm kiếm search
  // Những bài viết trong cộng đồng sẽ không tìm kiếm ở thanh search toàn cục
  async searchTweet({ query, user_id }: { query: IQuery<ITweet>; user_id: string }): Promise<ResMultiType<ITweet>> {
    //
    const { skip, limit, q, f, pf, sort, t } = getPaginationAndSafeQuery<ITweet>(query)

    //
    const followed_user_ids = await FollowsService.getUserFollowing(user_id)
    followed_user_ids.push(user_id)

    //
    const hasQ = { query: {}, projection: {}, sort: {}, score: {} }
    const hasF = { query: {} }
    const hasPf = {
      query: {}
    }
    const hasTop = {
      query: []
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
    if (f) {
      hasF.query = {
        'media.type': {
          $in: [EMediaType.Image, EMediaType.Video]
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
          },
          {
            audience: ETweetAudience.Mentions,
            mentions: { $in: [user_id] }
          }
        ]
      }
    }

    if (t) {
      hasTop.query = [
        {
          $lookup: {
            from: 'likes',
            let: { tid: '$_id' },
            pipeline: [{ $match: { $expr: { $eq: ['$tweet_id', '$$tid'] } } }, { $count: 'count' }],
            as: 'likes_count_arr'
          }
        },

        // lightweight lookup -> children counts grouped by type
        {
          $lookup: {
            from: 'tweets',
            let: { tid: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$parent_id', '$$tid'] } } },
              {
                $group: {
                  _id: '$parent_id',
                  comments_count: { $sum: { $cond: [{ $eq: ['$type', ETweetType.Comment] }, 1, 0] } },
                  retweets_count: { $sum: { $cond: [{ $eq: ['$type', ETweetType.Retweet] }, 1, 0] } },
                  quotes_count: { $sum: { $cond: [{ $eq: ['$type', ETweetType.QuoteTweet] }, 1, 0] } }
                }
              },
              { $project: { comments_count: 1, retweets_count: 1, quotes_count: 1 } }
            ],
            as: 'children_counts'
          }
        },

        // normalize counts to numbers
        {
          $addFields: {
            likes_count: { $ifNull: [{ $arrayElemAt: ['$likes_count_arr.count', 0] }, 0] },
            comments_count: { $ifNull: [{ $arrayElemAt: ['$children_counts.comments_count', 0] }, 0] },
            retweets_count: { $ifNull: [{ $arrayElemAt: ['$children_counts.retweets_count', 0] }, 0] },
            quotes_count: { $ifNull: [{ $arrayElemAt: ['$children_counts.quotes_count', 0] }, 0] }
          }
        },

        // engagement score + sort
        {
          $addFields: {
            engagement_score: {
              $add: [
                '$likes_count',
                '$retweets_count',
                '$comments_count',
                '$quotes_count',
                { $ifNull: ['$user_view', 0] }
              ]
            }
          }
        },
        { $sort: { engagement_score: -1, created_at: -1 } }
      ] as any
    }

    //
    const tweets = await TweetCollection.aggregate<TweetSchema>([
      {
        $match: {
          community_id: { $eq: null },
          ...hasQ.query,
          ...hasF.query,
          ...hasPf.query
        }
      },
      ...hasTop.query,
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
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
          let: { targetUserId: '$user_id._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$followed_user_id', '$$targetUserId'] }, { $eq: ['$user_id', new ObjectId(user_id)] }]
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
          from: 'users',
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
          // bookmarks_count: { $size: '$bookmarks' },
          likes_count: { $size: '$likes' },
          isLike: {
            $in: [new ObjectId(user_id), '$likes.user_id']
          },
          isBookmark: {
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

    // Cập nhật lại trending
    await TrendingService.createTrending(q)

    //
    return { total, total_page: Math.ceil(total / limit), items: tweets }
  }

  // Sử dụng cho tìm kiếm
  async searchUser({ query, user_id }: { query: IQuery<IUser>; user_id: string }): Promise<ResMultiType<IUser>> {
    const { skip, limit, q, pf, t } = getPaginationAndSafeQuery<IUser>(query)

    const hasPf = {
      query: {}
    }

    if (pf) {
      const followed_user_ids = await FollowsService.getUserFollowing(user_id)
      hasPf.query = { _id: { $in: followed_user_ids } }
    }

    //
    // --- 1️⃣ Truy vấn theo name / username (regex)
    //
    const regexMatch = {
      $match: {
        $or: [{ name: { $regex: q, $options: 'i' } }, { username: { $regex: q, $options: 'i' } }],
        ...hasPf.query
      }
    }

    const basePipeline = [
      regexMatch,
      {
        $lookup: {
          from: 'followers',
          localField: '_id',
          foreignField: 'followed_user_id',
          as: 'followers'
        }
      },
      {
        $lookup: {
          from: 'followers',
          localField: '_id',
          foreignField: 'user_id',
          as: 'following'
        }
      },
      {
        $addFields: {
          follower_count: { $size: '$followers' },
          following_count: { $size: '$following' },
          isFollow: {
            $in: [new ObjectId(user_id), '$followers.user_id']
          }
        }
      },
      ...(t === 'top'
        ? [{ $sort: { follower_count: -1, _id: 1 } }, { $skip: skip }, { $limit: limit }]
        : [{ $skip: skip }, { $limit: limit }]),
      {
        $project: {
          name: 1,
          username: 1,
          avatar: 1,
          verify: 1,
          bio: 1,
          follower_count: 1,
          following_count: 1,
          isFollow: 1
        }
      }
    ]

    let users = await UserCollection.aggregate<UserSchema>(basePipeline).toArray()

    //
    // --- 2️⃣ Nếu không có kết quả => fallback sang $text (chỉ bio)
    //
    if (users.length === 0 && q) {
      const textPipeline = [
        {
          $match: {
            $text: { $search: q },
            ...hasPf.query
          }
        },
        {
          $addFields: { score: { $meta: 'textScore' } }
        },
        {
          $sort: { score: -1 }
        },
        ...basePipeline.slice(1) // dùng lại phần lookup, addFields, project
      ]

      users = await UserCollection.aggregate<UserSchema>(textPipeline).toArray()
    }

    //
    // --- 3️⃣ Tổng số kết quả (dựa trên regex)
    //
    const total = await UserCollection.countDocuments({
      $or: [{ name: { $regex: q, $options: 'i' } }, { username: { $regex: q, $options: 'i' } }],
      ...hasPf.query
    })

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: users
    }
  }
}

export default new SearchService()
