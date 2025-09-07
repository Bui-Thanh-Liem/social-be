import { ObjectId } from 'mongodb'
import { LikeCollection } from '~/models/schemas/Like.schema'
import { TweetCollection, TweetSchema } from '~/models/schemas/Tweet.schema'
import { CreateTweetDto } from '~/shared/dtos/req/tweet.dto'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { EFeedType, ETweetType } from '~/shared/enums/type.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ITweet } from '~/shared/interfaces/schemas/tweet.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'
import FollowsService from './Follows.service'
import HashtagsService from './Hashtags.service'

class TweetsService {
  async create(user_id: string, payload: CreateTweetDto) {
    const { audience, type, content, parent_id, mentions, media } = payload
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
        media: media
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
                cover_photo: 1,
                verify: 1
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
      total_page: Math.ceil(total / limit),
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

    //
    const followed_user_ids = await FollowsService.getUserFollowed(user_id)
    followed_user_ids.push(user_id)

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
        $match: { type: { $ne: ETweetType.Comment } }
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

      //
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
          bookmarks_count: { $size: '$bookmarks' },
          likes_count: { $size: '$likes' },
          isLike: {
            $in: [new ObjectId(user_id), '$likes.user_id']
          },
          isBookmark: {
            $in: [new ObjectId(user_id), '$bookmarks.user_id']
          },
          isRetweet: {
            $gt: [
              {
                $size: {
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
              0
            ]
          },
          isQuote: {
            $gt: [
              {
                $size: {
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
              0
            ]
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
      TweetCollection.countDocuments(matchCondition),
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
          created_at: 1,
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

  async getProfileTweets({
    query,
    user_id,
    tweet_type,
    isHighlight,
    profile_id
  }: {
    user_id: string
    tweet_type: ETweetType
    query: IQuery<ITweet>
    profile_id: string
    isHighlight?: boolean
  }): Promise<ResMultiType<ITweet>> {
    //
    let { skip, limit, sort } = getPaginationAndSafeQuery<ITweet>(query)

    //
    const followed_user_ids = await FollowsService.getUserFollowed(user_id)
    followed_user_ids.push(user_id)
    if (user_id !== profile_id) {
      followed_user_ids.push(profile_id)
    }

    //
    const matchCondition: any = {
      user_id: new ObjectId(profile_id), // ✅ luôn lọc của chủ sở hữu
      type: tweet_type,
      $or: [
        { audience: ETweetAudience.Everyone }, // ai cũng xem
        {
          $and: [
            { audience: ETweetAudience.Followers },
            { user_id: { $in: followed_user_ids } } // chỉ khi có follow
          ]
        }
      ]
    }

    //
    if (isHighlight) {
      skip = 1
      limit = 20
      sort = { likes_count: -1, total_views: -1 } // Sắp xếp theo likes_count, sau đó total_views
    }

    const tweets = await TweetCollection.aggregate<TweetSchema>([
      {
        $match: matchCondition
      },
      ...(isHighlight
        ? [
            {
              $addFields: {
                total_views: { $add: ['$user_view', '$guest_view'] }
              }
            }
          ]
        : []),
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
          bookmarks_count: { $size: '$bookmarks' },
          likes_count: { $size: '$likes' },
          isLike: {
            $in: [new ObjectId(user_id), '$likes.user_id']
          },
          isBookmark: {
            $in: [new ObjectId(user_id), '$bookmarks.user_id']
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
      TweetCollection.countDocuments(matchCondition),
      TweetCollection.updateMany(
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
      if (user_id) {
        tweet.user_view += 1
      } else {
        tweet.guest_view += 1
      }
    })

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: tweets
    }
  }

  async getProfileMedia({
    query,
    user_id,
    profile_id
  }: {
    user_id: string
    query: IQuery<TweetSchema>
    profile_id: string
  }): Promise<ResMultiType<Pick<TweetSchema, '_id' | 'media'>>> {
    // Phân trang và truy vấn an toàn
    const { skip, limit, sort } = getPaginationAndSafeQuery<TweetSchema>(query)

    // Lấy danh sách người dùng được theo dõi
    const followed_user_ids = await FollowsService.getUserFollowed(user_id)
    if (!followed_user_ids.includes(user_id)) {
      followed_user_ids.push(user_id)
    }
    if (user_id !== profile_id && !followed_user_ids.includes(profile_id)) {
      followed_user_ids.push(profile_id)
    }

    // Điều kiện lọc tweet
    const matchCondition: any = {
      // type: ETweetType.Tweet,
      user_id: new ObjectId(profile_id),
      media: { $ne: null },
      $or: [
        { audience: ETweetAudience.Everyone },
        {
          $and: [{ audience: ETweetAudience.Followers }, { user_id: { $in: followed_user_ids } }]
        }
      ]
    }

    // Pipeline tổng hợp
    const tweets = await TweetCollection.aggregate<
      Pick<TweetSchema, '_id' | 'media' | 'updated_at' | 'guest_view' | 'user_view'>
    >([
      {
        $match: matchCondition
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
        $project: {
          _id: 1,
          media: 1
        }
      }
    ]).toArray()

    // Tăng số lượt xem
    const ids = tweets.map((tweet) => tweet._id as ObjectId)
    const date = new Date()

    const [total] = await Promise.all([
      TweetCollection.countDocuments(matchCondition),
      TweetCollection.updateMany(
        {
          _id: { $in: ids }
        },
        {
          $inc: { user_view: 1 },
          $set: { updated_at: date }
        }
      )
    ])

    // Cập nhật views trong kết quả trả về
    tweets.forEach((tweet) => {
      tweet.updated_at = date
      if (user_id) {
        tweet.user_view = (tweet.user_view || 0) + 1
      } else {
        tweet.guest_view = (tweet.guest_view || 0) + 1
      }
    })

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: tweets
    }
  }

  async getProfileLiked({
    query,
    profile_id
  }: {
    profile_id: string
    query: IQuery<TweetSchema>
  }): Promise<ResMultiType<TweetSchema>> {
    // Phân trang và truy vấn an toàn
    const { skip, limit, sort } = getPaginationAndSafeQuery<TweetSchema>(query)

    // Lấy danh sách người dùng được theo dõi
    const followed_user_ids = await FollowsService.getUserFollowed(profile_id)
    if (!followed_user_ids.includes(profile_id)) {
      followed_user_ids.push(profile_id)
    }

    // Lấy danh sách tweet_id mà user_id đã like
    const likedTweetIds = await LikeCollection.distinct('tweet_id', {
      user_id: new ObjectId(profile_id)
    })

    // Điều kiện lọc tweet
    const matchCondition: any = {
      $or: [
        { audience: ETweetAudience.Everyone },
        {
          $and: [{ audience: ETweetAudience.Followers }, { user_id: { $in: followed_user_ids } }]
        }
      ],
      _id: { $in: likedTweetIds } // Chỉ lấy tweet đã like
    }

    // Pipeline tổng hợp
    const tweets = await TweetCollection.aggregate<TweetSchema>([
      {
        $match: matchCondition
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
          bookmarks_count: { $size: '$bookmarks' },
          likes_count: { $size: '$likes' },
          isLike: {
            $in: [new ObjectId(profile_id), '$likes.user_id']
          },
          isBookmark: {
            $in: [new ObjectId(profile_id), '$bookmarks.user_id']
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
      TweetCollection.countDocuments(matchCondition),
      ids.length > 0
        ? TweetCollection.updateMany(
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
      if (profile_id) {
        tweet.user_view = (tweet.user_view || 0) + 1
      } else {
        tweet.guest_view = (tweet.guest_view || 0) + 1
      }
    })

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: tweets
    }
  }
}

export default new TweetsService()
