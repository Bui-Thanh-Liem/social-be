import { ObjectId } from 'mongodb'
import database from '~/configs/database.config'
import { deleteChildrenTweet } from '~/libs/bull/queues/deleteChildrenTweet'
import { BookmarkCollection } from '~/models/schemas/Bookmark.schema'
import { LikeCollection } from '~/models/schemas/Like.schema'
import { TweetCollection, TweetSchema } from '~/models/schemas/Tweet.schema'
import { UserCollection } from '~/models/schemas/User.schema'
import { NotFoundError } from '~/shared/classes/error.class'
import { CONSTANT_JOB } from '~/shared/constants'
import { CreateTweetDto } from '~/shared/dtos/req/tweet.dto'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { EFeedType, EMediaType, ENotificationType, ETweetType } from '~/shared/enums/type.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ITweet } from '~/shared/interfaces/schemas/tweet.interface'
import { ResMultiType } from '~/shared/types/response.type'
import CommentGateway from '~/socket/gateways/Comment.gateway'
import { chunkArray } from '~/utils/chunkArray'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'
import { deleteImage } from '~/utils/upload.util'
import BookmarksService from './Bookmarks.service'
import FollowsService from './Follows.service'
import HashtagsService from './Hashtags.service'
import LikesService from './Likes.service'
import NotificationService from './Notification.service'
import TrendingService from './Trending.service'
import VideosService from './Videos.service'
import { CommunityCollection } from '~/models/schemas/Community.schema'

class TweetsService {
  async create(user_id: string, payload: CreateTweetDto) {
    const { audience, type, content, parent_id, community_id, mentions, media } = payload

    // Tạo hashtags chop tweet
    const hashtags = await HashtagsService.checkHashtags(payload.hashtags)

    // Thêm hashtag vào trending
    if (payload?.hashtags?.length && type !== ETweetType.Comment) {
      await Promise.all(payload.hashtags.map((hashtagName) => TrendingService.createTrending(`#${hashtagName}`)))
    }

    // Thêm từ khóa vào trending (những từ trong content, nhưng được viết in hoa)
    if (content && type !== ETweetType.Comment) {
      const keyWords = content.match(/\b[A-Z][a-zA-Z0-9]*\b/g) || []
      await Promise.all(keyWords.map((w) => TrendingService.createTrending(w)))
    }

    //
    if (parent_id) {
      const exist = await TweetCollection.findOne({ _id: new ObjectId(parent_id) })
      if (!exist) {
        throw new NotFoundError('Có lỗi xảy ra vui lòng thử lại (không tìm thấy bài viết cha)')
      }
    }

    //
    if (community_id) {
      const exist = await CommunityCollection.findOne({ _id: new ObjectId(community_id) })
      if (!exist) {
        throw new NotFoundError('Có lỗi xảy ra vui lòng thử lại (không tìm thấy cộng đồng)')
      }
    }

    //
    const newTweet = await TweetCollection.insertOne(
      new TweetSchema({
        type: type,
        user_id: new ObjectId(user_id),
        audience: audience,
        hashtags: hashtags,
        content: content,
        parent_id: parent_id ? new ObjectId(parent_id) : null,
        community_id: community_id ? new ObjectId(community_id) : null,
        mentions: mentions ? mentions.map((id) => new ObjectId(id)) : [],
        media: media
      })
    )

    // Mentions
    const sender = await UserCollection.findOne({ _id: new ObjectId(user_id) }, { projection: { name: 1 } })

    // Gửi thông báo cho ai mà người comment/tweet nhắc đến
    if (mentions?.length) {
      for (let i = 0; i < mentions.length; i++) {
        await NotificationService.create({
          content: `${sender?.name} đã nhắc đến bạn trong một ${type === ETweetType.Comment ? 'bình luận' : 'bài viết'}.`,
          type: ENotificationType.Mention_like,
          sender: user_id,
          receiver: mentions[i],
          refId: newTweet.insertedId.toString()
        })
      }
    }

    // Gửi thông báo cho chủ bài viết là có người bình luận
    // ---
    // Emit comment mới về bài viết parent
    if (type === ETweetType.Comment && parent_id) {
      const tw = await TweetCollection.findOne({ _id: new ObjectId(parent_id) }, { projection: { user_id: 1 } })
      await NotificationService.create({
        content: `${sender?.name} đã bình luận bài viết của bạn.`,
        type: ENotificationType.Mention_like,
        sender: user_id,
        receiver: tw!.user_id.toString(),
        refId: tw?._id.toString()
      })

      //
      const newTw = await this.getOneById(user_id, newTweet.insertedId.toString())
      if (newTw && tw) {
        await CommentGateway.sendNewComment(newTw, tw._id.toString())
      }
    }

    return newTweet
  }

  async getOneById(user_active_id: string, tweet_id: string) {
    //
    const followed_user_ids = await FollowsService.getUserFollowing(user_active_id)
    followed_user_ids.push(user_active_id)

    // Dynamic match condition based on feed type
    const matchCondition = {
      _id: new ObjectId(tweet_id),
      $or: [
        { audience: ETweetAudience.Everyone },
        {
          audience: ETweetAudience.Followers,
          user_id: { $in: followed_user_ids }
        },
        {
          audience: ETweetAudience.Mentions,
          mentions: { $in: [user_active_id] }
        }
      ]
    }

    const result = await TweetCollection.aggregate<TweetSchema>([
      {
        $match: matchCondition
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
                username: 1
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
            $in: [new ObjectId(user_active_id), '$likes.user_id']
          },
          isBookmark: {
            $in: [new ObjectId(user_active_id), '$bookmarks.user_id']
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
                        { $eq: ['$$child.user_id', new ObjectId(user_active_id)] }
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
                username: 1,
                avatar: 1,
                verify: 1
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

  //
  // Chỉ có những bài viết không trong cộng đồng
  async getNewFeeds({
    query,
    feed_type,
    user_active_id
  }: {
    query: IQuery<ITweet>
    user_active_id: string
    feed_type: EFeedType
  }): Promise<ResMultiType<ITweet>> {
    //
    const { skip, limit, sort } = getPaginationAndSafeQuery<ITweet>(query)

    //
    const followed_user_ids = await FollowsService.getUserFollowing(user_active_id)
    followed_user_ids.push(user_active_id)

    // Dynamic match condition based on feed type
    let matchCondition: any

    switch (feed_type) {
      case EFeedType.Following:
        // Chỉ tweets following
        matchCondition = {
          user_id: { $in: followed_user_ids.map((id) => new ObjectId(id)) }
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
            },
            {
              audience: ETweetAudience.Mentions,
              mentions: { $in: [user_active_id] }
            }
          ]
        }
    }

    const tweets = await TweetCollection.aggregate<TweetSchema>([
      {
        $match: {
          community_id: { $eq: null },
          ...matchCondition
        }
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
                  $and: [
                    { $eq: ['$followed_user_id', '$$targetUserId'] },
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
            $in: [new ObjectId(user_active_id), '$likes.user_id']
          },
          isBookmark: {
            $in: [new ObjectId(user_active_id), '$bookmarks.user_id']
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
                        { $eq: ['$$child.user_id', new ObjectId(user_active_id)] }
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
      if (user_active_id) {
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

  //
  async getProfileTweets({
    query,
    user_active_id,
    tweet_type,
    isHighlight,
    user_id
  }: {
    user_active_id: string
    tweet_type: ETweetType
    query: IQuery<ITweet>
    user_id: string
    isHighlight?: boolean
  }): Promise<ResMultiType<ITweet>> {
    //
    let { skip, limit, sort } = getPaginationAndSafeQuery<ITweet>(query)

    // Lấy danh sách của người nào đang theo dõi user_id
    const followed_user_ids = await FollowsService.getUserFollowers(user_id)

    // ép về string để so sánh cho chắc
    const isFollowing = followed_user_ids.some((f: ObjectId | string) => f.toString() === user_active_id.toString())

    //
    const matchCondition: any = {
      user_id: new ObjectId(user_id),
      type: tweet_type
    }

    // Nếu người xem profile là chính chủ
    if (user_active_id === user_id) {
      matchCondition.audience = { $in: [ETweetAudience.Everyone, ETweetAudience.Followers] }
    } else {
      // Nếu người khác xem profile
      matchCondition.$or = [
        { audience: ETweetAudience.Everyone },
        ...(isFollowing ? [{ audience: ETweetAudience.Followers }] : [])
      ]

      // Nếu là người khác xem profile của mình thì không cho thấy
      matchCondition.community_id = { $eq: null }
    }

    //
    if (isHighlight) {
      skip = 1
      limit = 20
      sort = { likes_count: -1, total_views: -1 } // Sắp xếp theo likes_count, sau đó total_views
    }

    // Pipeline tổng hợp
    const tweets = await TweetCollection.aggregate<TweetSchema>([
      {
        $match: matchCondition
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
                  $and: [
                    { $eq: ['$followed_user_id', '$$targetUserId'] },
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
          likes_count: { $size: '$likes' },
          isLike: {
            $in: [new ObjectId(user_active_id), '$likes.user_id']
          },
          isBookmark: {
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
      if (user_active_id) {
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

  async getTweetLiked({
    query,
    user_active_id
  }: {
    user_active_id: string
    query: IQuery<TweetSchema>
  }): Promise<ResMultiType<TweetSchema>> {
    // Phân trang và truy vấn an toàn
    const { skip, limit, sort, q } = getPaginationAndSafeQuery<TweetSchema>(query)

    // Lấy danh sách tweet_id mà user_id đã like
    const likedTweetIds = await LikeCollection.distinct('tweet_id', {
      user_id: new ObjectId(user_active_id)
    })

    // Điều kiện lọc tweet
    const matchCondition: any = {
      _id: { $in: likedTweetIds } // Chỉ lấy tweet đã like
    }

    //
    if (q) {
      matchCondition.$text = { $search: q }
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
      // lookup để kiểm tra user hiện tại có follow user_id không
      {
        $lookup: {
          from: 'followers',
          let: { targetUserId: '$user_id._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$followed_user_id', '$$targetUserId'] },
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
            $in: [new ObjectId(user_active_id), '$likes.user_id']
          },
          isBookmark: {
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
      if (user_active_id) {
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

  async getTweetBookmarked({
    query,
    user_active_id
  }: {
    user_active_id: string
    query: IQuery<TweetSchema>
  }): Promise<ResMultiType<TweetSchema>> {
    // Phân trang và truy vấn an toàn
    const { skip, limit, sort, q } = getPaginationAndSafeQuery<TweetSchema>(query)

    // Lấy danh sách tweet_id mà user_id đã bookmark
    const bookmarkedTweetIds = await BookmarkCollection.distinct('tweet_id', {
      user_id: new ObjectId(user_active_id)
    })

    // Điều kiện lọc tweet
    const matchCondition: any = {
      _id: { $in: bookmarkedTweetIds } // Chỉ lấy tweet đã bookmarks
    }

    //
    if (q) {
      matchCondition.$text = { $search: q }
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
      // lookup để kiểm tra user hiện tại có follow user_id không
      {
        $lookup: {
          from: 'followers',
          let: { targetUserId: '$user_id._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$followed_user_id', '$$targetUserId'] },
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
          from: 'users',
          localField: 'mentions',
          foreignField: '_id',
          as: 'mentions',
          pipeline: [
            {
              $project: {
                name: 1,
                username: 1
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
          likes_count: { $size: '$likes' },
          isLike: {
            $in: [new ObjectId(user_active_id), '$likes.user_id']
          },
          isBookmark: {
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
      if (user_active_id) {
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

  async delete(tweet_id: string) {
    const session = database.getClient().startSession()
    try {
      await session.withTransaction(async () => {
        // Lấy tweet trước
        const tweet = await TweetCollection.findOne({ _id: new ObjectId(tweet_id) })

        if (!tweet) {
          throw new NotFoundError('Không tìm thấy bài viết để xóa')
        }

        // Xoá DB trước
        const result = await TweetCollection.deleteOne({ _id: new ObjectId(tweet_id) })
        if (result.deletedCount === 0) {
          throw new NotFoundError('Không tìm thấy bài viết để xóa')
        }

        // Xóa ảnh
        if (tweet?.media && tweet?.media?.type === EMediaType.Image) {
          // Lấy filename từ url: http://domain/images/abc.png => abc.png
          const filename = tweet.media?.url.split('/').pop()
          if (filename) {
            await deleteImage(filename).catch((err) => {
              console.log('Tweet - delete - media - img:::', err)
            })
          }
        }

        // Xóa video
        if (tweet?.media && tweet?.media?.type === EMediaType.Video) {
          // Lấy folderName: http://localhost:9000/videos-hls/RXhw4s21AEzt_-VpjWIin/master.m3u8
          const parts = tweet.media?.url.split('/')
          const folderName = parts[parts.length - 2] // "RXhw4s21AEzt_-VpjWIin"
          if (folderName) {
            await VideosService.delete(folderName)
          }
        }

        // Xóa các record của bookmark/like/comment
        await deleteChildrenTweet.add(CONSTANT_JOB.DELETE_CHILDREN_TWEET, { parent_id: tweet_id })
      })
      return true
    } catch (error) {
      console.error('Transaction failed:', error)
      throw error
    } finally {
      session.endSession()
    }
  }

  // Hàm xóa tất cả tweet con của 1 tweet cha (comment)
  async deleteChildrenTweet(parent_id: string) {
    //
    await BookmarksService.deleteByTweetId(parent_id)
    await LikesService.deleteByTweetId(parent_id)

    //
    const childrenIds = await TweetCollection.find(
      { parent_id: new ObjectId(parent_id), type: ETweetType.Comment },
      { projection: { _id: 1 } }
    ).toArray()

    // tránh đẹ quy vô tận
    if (!childrenIds.length) {
      console.log('Không có comment cần xóa')
      return
    }

    const ids = childrenIds.map((tw) => tw._id.toString())

    // Chia nhỏ để tránh nghẽn — ví dụ mỗi chunk 100 tweet
    const chunks = chunkArray(ids, 100)

    for (const [index, batch] of chunks.entries()) {
      console.log(`🔹 Deleting batch ${index + 1}/${chunks.length} (${batch.length} items)`)

      // Giới hạn số lượng promise chạy song song (ví dụ 10 mỗi lần)
      const CONCURRENCY = 10
      for (let i = 0; i < batch.length; i += CONCURRENCY) {
        const group = batch.slice(i, i + CONCURRENCY)
        await Promise.allSettled(group.map((id) => this.delete(id)))
      }
    }

    console.log(`✅ Finished deleting ${ids.length} children of ${parent_id}`)
  }
}

export default new TweetsService()
