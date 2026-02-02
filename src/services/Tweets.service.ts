import { Filter, ObjectId } from 'mongodb'
import { notificationQueue } from '~/bull/queues'
import { cleanupQueue } from '~/bull/queues/cleanup.queue'
import { BadRequestError, NotFoundError } from '~/core/error.response'
import { clientMongodb } from '~/dbs/init.mongodb'
import cacheService from '~/helpers/cache.helper'
import pessimisticLockServiceInstance from '~/helpers/pessimistic-lock'
import { signedCloudfrontUrl } from '~/libs/cloudfront.lib'
import { BookmarkCollection } from '~/models/schemas/Bookmark.schema'
import { CommunityCollection, CommunitySchema } from '~/models/schemas/Community.schema'
import { LikeCollection } from '~/models/schemas/Like.schema'
import { TweetCollection, TweetSchema } from '~/models/schemas/Tweet.schema'
import { UserCollection } from '~/models/schemas/User.schema'
import { CONSTANT_CHUNK_SIZE, CONSTANT_JOB, CONSTANT_REGEX } from '~/shared/constants'
import { CreateNotiCommentDto } from '~/shared/dtos/req/notification.dto'
import { CreateTweetDto } from '~/shared/dtos/req/tweet.dto'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { ETweetStatus } from '~/shared/enums/status.enum'
import {
  EFeedType,
  EFeedTypeItem,
  EMembershipType,
  ENotificationType,
  ETweetType,
  EVisibilityType
} from '~/shared/enums/type.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ICommunity } from '~/shared/interfaces/schemas/community.interface'
import { IMedia } from '~/shared/interfaces/schemas/media.interface'
import { ITweet } from '~/shared/interfaces/schemas/tweet.interface'
import { ResMultiType } from '~/shared/types/response.type'
import CommentGateway from '~/socket/gateways/Comment.gateway'
import CommunityGateway from '~/socket/gateways/Community.gateway'
import { chunkArray } from '~/utils/chunk-array'
import { convertObjectId } from '~/utils/convert-object-id'
import { createKeyTweetDetails, createKeyTweetDetailsLock } from '~/utils/create-key-cache.util'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import BookmarksService from './Bookmarks.service'
import CommunityService from './Communities.service'
import FollowsService from './Follows.service'
import HashtagsService from './Hashtags.service'
import LikesService from './Likes.service'
import TrendingService from './Trending.service'
import UploadsServices from './Uploads.service'
import { normalizeWeekData } from '~/utils/normalize-week-data.util'
import { ResCountViewLinkBookmarkInWeek } from '~/shared/dtos/res/tweet.dto'
import { IUser } from '~/shared/interfaces/schemas/user.interface'

class TweetsService {
  //
  async create(user_id: string, payload: CreateTweetDto) {
    let message = 'Đăng bài thành công'
    const { audience, type, content, parent_id, community_id, mentions, medias, bgColor, textColor, codes } = payload

    //
    let _medias: undefined | IMedia[] = undefined
    if (medias) {
      _medias = await UploadsServices.getMultiByKeys(medias.map((m) => m.s3_key))
    }

    // Kiểm tra nếu có parent_id
    if (parent_id) {
      const exist = await TweetCollection.findOne({ _id: new ObjectId(parent_id) })
      if (!exist) {
        throw new NotFoundError('Có lỗi xảy ra vui lòng thử lại.')
      }
    }

    // Tạo hashtags chop tweet
    const hashtags = await HashtagsService.checkHashtags(payload.hashtags)

    // Thêm hashtag vào trending
    if (payload?.hashtags?.length && type !== ETweetType.Comment) {
      await Promise.all(payload.hashtags.map((hashtagName) => TrendingService.createTrending(`#${hashtagName}`)))
    }

    // Thêm từ khóa vào trending (những từ trong content, nhưng được viết in hoa)
    if (content && type !== ETweetType.Comment) {
      const keyWords = content.match(CONSTANT_REGEX.FIND_KEYWORD) || []
      await Promise.all(keyWords.map((w) => TrendingService.createTrending(w)))
    }

    // Kiểm tra nếu đăng trong cộng đồng
    let status = ETweetStatus.Ready
    let operatorIds = [] as ObjectId[]
    let community: null | ICommunity = null
    if (community_id) {
      const {
        mentorIds,
        is_admin,
        is_mentor,
        community: _community
      } = await CommunityService.validateCommunityAndMembership({
        user_id: user_id,
        community_id: community_id
      })

      community = _community
      if (is_admin || is_mentor) {
        status = ETweetStatus.Ready
      } else {
        status = ETweetStatus.Pending
        operatorIds = [...mentorIds, _community.admin]
        message = 'Đăng bài thành công, chờ điều hành viên phê duyệt.'
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
        medias: _medias?.length ? _medias : medias,
        status: status,
        textColor: textColor || '',
        bgColor: bgColor || '',
        codes: codes || null
      })
    )

    // Mentions
    const sender = await UserCollection.findOne({ _id: new ObjectId(user_id) }, { projection: { name: 1 } })

    // Gửi thông báo cho ai mà người comment/tweet nhắc đến
    if (mentions?.length) {
      // Nếu nhiều hơn 50 thành viên → tách nhỏ thành nhiều chunk để tránh lỗi payload quá lớn
      const chunks = chunkArray(mentions, CONSTANT_CHUNK_SIZE)
      for (const chunk of chunks) {
        //
        const jobs = chunk.map((receiverId) => ({
          name: CONSTANT_JOB.SEND_NOTI,
          data: {
            content: `${sender?.name} đã nhắc đến bạn trong một ${
              type === ETweetType.Comment ? 'bình luận' : 'bài viết'
            }.`,
            type: ENotificationType.Mention_like,
            sender: user_id,
            receiver: receiverId,
            ref_id: newTweet.insertedId.toString()
          },
          opts: {
            removeOnComplete: true,
            attempts: 3 // retry nếu queue bị lỗi
          }
        }))

        await notificationQueue.addBulk(jobs)
      }
    }

    // Gửi thông báo cho chủ bài viết là có người bình luận
    // ---
    // Emit comment mới về bài viết parent
    if (type === ETweetType.Comment && parent_id) {
      await notificationQueue.add(CONSTANT_JOB.SEND_NOTI_COMMENT, {
        sender_id: user_id,
        tweet_id: parent_id
      } as CreateNotiCommentDto)

      //
      const newTw = await this.getOneById(user_id, newTweet.insertedId.toString())
      if (newTw && parent_id) {
        await CommentGateway.sendNewComment(newTw, parent_id)
      }
    }

    // Gửi thông báo cho điều hành viên của cộng đồng
    if (community_id && community && operatorIds.length > 0) {
      // Nếu nhiều hơn 50 thành viên → tách nhỏ thành nhiều chunk để tránh lỗi payload quá lớn
      const chunks = chunkArray(operatorIds, CONSTANT_CHUNK_SIZE)
      for (const chunk of chunks) {
        // tạo jobs
        const jobs = chunk.map((id) => ({
          name: CONSTANT_JOB.SEND_NOTI,
          data: {
            content: `${sender?.name} đã đăng bài viết mới trong cộng đồng ${community.name}, đang chờ duyệt bài.`,
            type: ENotificationType.Community,
            sender: user_id,
            receiver: id.toString(),
            ref_id: community_id
          }
        }))

        //
        await notificationQueue.addBulk(jobs)
        await CommunityGateway.sendCountTweetApprove(community_id)
      }
    }

    return {
      message,
      result: newTweet
    }
  }

  // (cache, pessimistic lock) => sử dụng đệ quy
  async getOneById(user_active_id: string, tweet_id: string): Promise<TweetSchema | null> {
    // 1. Tạo key cache
    const key_cache = createKeyTweetDetails(tweet_id)

    // 2. Kiểm tra cache trong Redis trước
    const tweet_cache = await cacheService.get<TweetSchema>(key_cache)

    // 3. Nếu có cache thì trả về luôn - "null" cũng là 1 giá trị hợp lệ
    if (tweet_cache) {
      console.log('Get in cached')
      return this._processUserSpecificFields(tweet_cache, user_active_id)
    }

    //  4. Thiết lập khóa để tránh thundering herd problem
    const resource = createKeyTweetDetailsLock(tweet_id)
    const lockTTL = 10000 // 10 giây
    const lockVal = (Date.now() + lockTTL + 1).toString()
    const lock = await pessimisticLockServiceInstance.acquire(resource, lockVal, lockTTL)

    //.   - Nếu có lock thì mới được truy vấn DB
    if (lock) {
      try {
        // 5. Nếu không có cache thì truy vấn DB
        const tweet_db = await this._getOneById(user_active_id, tweet_id)

        //    - Nếu không tìm thấy tweet
        if (!tweet_db) {
          //  - Flow bình thường thì sẽ không có trường hợp này xảy ra
          //  - Trường hợp không tìm thấy tweet, lưu cache null trong 3 giây để tránh tấn công dò tìm id (Anti-DDoS)
          await cacheService.set(key_cache, null, 3) // Negative Caching
          throw new NotFoundError('Tweet không tồn tại')
        }

        //    - Lưu vào cache với ttl 5 phút
        await cacheService.set(key_cache, tweet_db, 300)

        //    - Tính toán is_like và is_bookmark ở tầng ứng dụng (Application Layer)
        return this._processUserSpecificFields(tweet_db, user_active_id)
      } catch (err) {
        console.log('Error in getOneById:', err)
        throw err
      } finally {
        // 6. Dù thành công hay lỗi thì cũng phải release lock
        const lockValue = await pessimisticLockServiceInstance.isLocked(resource)
        if (lockValue) {
          await pessimisticLockServiceInstance.release(resource, lockVal)
        }
      }
    } else {
      // Nếu không lấy được lock thì chờ 100ms và thử lại
      await new Promise((resolve) => setTimeout(resolve, 100))
      return this.getOneById(user_active_id, tweet_id)
    }
  }

  //
  private async _getOneById(user_active_id: string, tweet_id: string): Promise<TweetSchema | null> {
    const followed_user_ids = await FollowsService.getUserFollowing(user_active_id)
    followed_user_ids.push(user_active_id)

    //
    const userActiveObjectId = new ObjectId(user_active_id)

    // 1. Định nghĩa điều kiện match (không đổi)
    const match_condition = {
      _id: new ObjectId(tweet_id),
      status: ETweetStatus.Ready,
      $or: [
        { audience: ETweetAudience.Everyone },
        {
          audience: ETweetAudience.Followers,
          user_id: { $in: followed_user_ids }
        },
        {
          audience: ETweetAudience.Mentions,
          mentions: { $in: [userActiveObjectId] }
        },
        {
          user_id: userActiveObjectId // Chủ bài viết có quyền xem tất cả
        }
      ]
    }

    // 2. Aggregate để lấy chi tiết tweet (bỏ $addFields tính is_like, is_bookmark)
    const tweet_db = await TweetCollection.aggregate<TweetSchema>([
      {
        $match: match_condition
      },
      {
        $lookup: {
          from: 'users',
          localField: 'mentions',
          foreignField: '_id',
          as: 'mentions',
          pipeline: [{ $project: { name: 1, username: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'communities',
          localField: 'community_id',
          foreignField: '_id',
          as: 'community_id',
          pipeline: [{ $project: { _id: 1, name: 1, slug: 1, visibility_type: 1 } }]
        }
      },
      {
        $unwind: { path: '$community_id', preserveNullAndEmptyArrays: true }
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
                avatar: 1,
                name: 1,
                bio: 1,
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
          likes_count: { $size: '$likes' },
          // is_like: {
          //   $in: [new ObjectId(user_active_id), '$likes.user_id']
          // },
          // is_bookmark: {
          //   $in: [new ObjectId(user_active_id), '$bookmarks.user_id']
          // },
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
                        { $eq: ['$$child.user_id', userActiveObjectId] }
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
                        { $eq: ['$$child.user_id', userActiveObjectId] }
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
    console.log('Get in DB')

    //
    if (tweet_db?.community_id) {
      const community = tweet_db?.community_id as unknown as CommunitySchema
      if (community.visibility_type === EVisibilityType.Private) {
        throw new NotFoundError('Bài viết trong cộng đồng riêng tư không được phép xem ở chế độ này.')
      }
    }

    // 3. Trả về kết quả
    return tweet_db
  }

  /**
   * @description Hàm tách riêng để xử lý các trường động theo user (is_like, is_bookmark)
   * @param tweet_db Kết quả tweet từ MongoDB Aggregate
   * @param user_active_id ID người dùng đang hoạt động
   * @returns TweetSchema với các trường is_like, is_bookmark đã được thêm vào.
   */
  private _processUserSpecificFields(tweet_db: any, user_active_id: string): TweetSchema {
    const userActiveObjectId = new ObjectId(user_active_id)

    // Lấy mảng user_id đã like và bookmark từ kết quả Aggregate
    const liked_user_ids = tweet_db.likes.map((like: any) => like.user_id.toString())
    const bookmarked_user_ids = tweet_db.bookmarks.map((bookmark: any) => bookmark.user_id.toString())

    // Kiểm tra và thêm trường mới vào object
    tweet_db.is_like = liked_user_ids.includes(userActiveObjectId.toString())
    tweet_db.is_bookmark = bookmarked_user_ids.includes(userActiveObjectId.toString())

    //
    console.log('liked_user_ids:::', liked_user_ids)
    console.log('userActiveObjectId:::', userActiveObjectId)
    // console.log('tweet_db:::', tweet_db)

    return this.signedCloudfrontMediaUrls(tweet_db) as TweetSchema
  }

  //
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
      items: this.signedCloudfrontMediaUrls(tweets) as TweetSchema[]
    }
  }

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
    const activeObjectId = new ObjectId(user_active_id)
    const { skip, limit, sort } = getPaginationAndSafeQuery<ITweet>(query)

    //
    const followed_user_ids = await FollowsService.getUserFollowing(user_active_id)
    followed_user_ids.push(user_active_id)

    // Dynamic match condition based on feed type
    let match_condition: any

    switch (feed_type) {
      case EFeedType.Following:
        // Chỉ tweets following
        match_condition = {
          user_id: { $in: followed_user_ids.map((id) => new ObjectId(id)) }
        }
        break
      case EFeedType.Everyone:
        // Chỉ tweets công khai từ tất cả mọi người
        match_condition = {
          audience: ETweetAudience.Everyone
        }
        break

      default:
        match_condition = {
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

    const skipCom = Math.floor(skip / 3)
    const [tweets, communities] = await Promise.all([
      TweetCollection.aggregate<TweetSchema>([
        {
          $match: {
            community_id: { $eq: null },
            ...match_condition
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
            is_like: {
              $in: [new ObjectId(user_active_id), '$likes.user_id']
            },
            is_bookmark: {
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
      ]).toArray(),
      feed_type !== EFeedType.Following &&
        CommunityCollection.aggregate<CommunitySchema>([
          // 1️⃣ Chỉ lấy community mở
          { $match: { membership_type: EMembershipType.Open, admin: { $ne: activeObjectId } } },

          // 2️⃣ Join sang bảng mentor
          {
            $lookup: {
              from: 'community-mentors',
              localField: '_id',
              foreignField: 'community_id',
              as: 'mentors'
            }
          },

          // 3️⃣ Join sang bảng member
          {
            $lookup: {
              from: 'community-members',
              localField: '_id',
              foreignField: 'community_id',
              as: 'members'
            }
          },

          // 4️⃣ Lọc bỏ community mà user đã là mentor hoặc member
          {
            $match: {
              'mentors.user_id': { $ne: activeObjectId },
              'members.user_id': { $ne: activeObjectId }
            }
          },

          { $sort: sort },
          { $skip: skipCom },
          { $limit: 2 },
          {
            $unwind: {
              path: '$admin',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $project: {
              mentors: 0,
              members: 0,
              pin: 0,
              bio: 0
            }
          }
        ]).toArray()
    ])

    // Increase views
    const ids = tweets.map((tweet) => tweet._id as ObjectId)
    const date = new Date()

    const [total] = await Promise.all([
      TweetCollection.countDocuments(match_condition),
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
      items: this.signedCloudfrontMediaUrls(tweets) as TweetSchema[],
      extra: { type: EFeedTypeItem.Community, items: communities || [] }
    }
  }

  //
  async increaseView(tweet_id: ObjectId, user_id: string | null) {
    const inc = user_id ? { user_view: 1 } : { guest_view: 1 }

    const result = await TweetCollection.findOneAndUpdate(
      {
        _id: convertObjectId(tweet_id)
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

  //
  async getTweetOnlyUserId(tweet_id: string) {
    const tweet = await TweetCollection.aggregate<TweetSchema>([
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

    return this.signedCloudfrontMediaUrls(tweet) as TweetSchema
  }

  //
  async getProfileTweets({
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
    const followed_user_ids = await FollowsService.getUserFollowers(user_id)

    // ép về string để so sánh cho chắc
    const is_following = followed_user_ids.some((f: ObjectId | string) => f.toString() === user_active_id.toString())

    //
    const match_condition: any = {
      user_id: new ObjectId(user_id),
      type: tweet_type
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
    const tweets = await TweetCollection.aggregate<TweetSchema>([
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
        $lookup: {
          from: 'communities',
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
      TweetCollection.countDocuments(match_condition),
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
      items: this.signedCloudfrontMediaUrls(tweets) as TweetSchema[]
    }
  }

  //
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
    const match_condition: any = {
      _id: { $in: likedTweetIds } // Chỉ lấy tweet đã like
    }

    //
    if (q) {
      match_condition.$text = { $search: q }
    }

    // Pipeline tổng hợp
    const tweets = await TweetCollection.aggregate<TweetSchema>([
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
      TweetCollection.countDocuments(match_condition),
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
      items: this.signedCloudfrontMediaUrls(tweets) as TweetSchema[]
    }
  }

  //
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
    const bookmarked_tweet_ids = await BookmarkCollection.distinct('tweet_id', {
      user_id: new ObjectId(user_active_id)
    })

    // Điều kiện lọc tweet
    const match_condition: any = {
      _id: { $in: bookmarked_tweet_ids } // Chỉ lấy tweet đã bookmarks
    }

    //
    if (q) {
      match_condition.$text = { $search: q }
    }

    // Pipeline tổng hợp
    const tweets = await TweetCollection.aggregate<TweetSchema>([
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
      TweetCollection.countDocuments(match_condition),
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
      items: this.signedCloudfrontMediaUrls(tweets) as TweetSchema[]
    }
  }

  //
  async delete(tweet_id: string) {
    const session = clientMongodb.startSession()
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

        // Xóa medias khỏi S3
        if (tweet.medias) {
          await UploadsServices.delete({ s3_keys: tweet.medias.map((m) => m.s3_key) })
        }

        // Xóa các record của bookmark/like/comment
        await cleanupQueue.add(CONSTANT_JOB.DELETE_CHILDREN_TWEET, { parent_id: tweet_id })
      })
      return true
    } catch (error) {
      console.error('Lỗi xóa tweet:', error)
      throw error
    } finally {
      session.endSession()
    }
  }

  // Hàm xóa tất cả tweet con của 1 tweet cha (comment)
  async deleteChildrenTweet(parent_id: string) {
    try {
      // Xoá bookmark và like của tweet cha trước
      // Lấy tất cả tweet con (comment)
      const [children_ids] = await Promise.all([
        TweetCollection.find(
          { parent_id: new ObjectId(parent_id), type: ETweetType.Comment },
          { projection: { _id: 1 } }
        ).toArray(),
        BookmarksService.deleteByTweetId(parent_id),
        LikesService.deleteByTweetId(parent_id)
      ])

      // ********** tránh đệ quy vô tận **********
      if (!children_ids.length) {
        console.log('Không có comment cần xóa')
        return
      }

      // Chia nhỏ để tránh nghẽn — ví dụ mỗi chunk CONSTANT_CHUNK_SIZE tweet
      const ids = children_ids.map((tw) => tw._id.toString())
      const chunks = chunkArray(ids, CONSTANT_CHUNK_SIZE)

      // Xoá từng chunk một
      for (const [index, batch] of chunks.entries()) {
        console.log(`🔹 Đang xóa batch ${index + 1}/${chunks.length} (${batch.length} items)`)

        // Giới hạn số lượng promise chạy song song (ví dụ 10 mỗi lần)
        const CONCURRENCY = 10
        for (let i = 0; i < batch.length; i += CONCURRENCY) {
          const group = batch.slice(i, i + CONCURRENCY)
          await Promise.allSettled(group.map((id) => this.delete(id)))
        }
      }

      console.log(`✅ Finished deleting ${ids.length} children of ${parent_id}`)
    } catch (error) {
      console.error('Lỗi xóa các tweet con:', error)
      throw error
    }
  }

  //
  async changeStatusTweet({ tweet_id, status }: { tweet_id: string; status: ETweetStatus }) {
    const tweet = await TweetCollection.findOne(
      { _id: new ObjectId(tweet_id) },
      {
        projection: {
          _id: 1,
          status: 1,
          user_id: 1
        }
      }
    )

    if (!tweet) {
      throw new NotFoundError('Bài viết không tồn tại hoặc đã bị gỡ bỏ.')
    }

    if (tweet.status !== ETweetStatus.Pending) {
      throw new BadRequestError('Trạng thái bài viết không hợp lệ.')
    }

    await TweetCollection.updateOne(
      { _id: new ObjectId(tweet_id) },
      {
        $set: {
          status: status
        }
      }
    )

    return this.signedCloudfrontMediaUrls(tweet) as TweetSchema
  }

  //
  async getUserIdByTweetId(tweet_id: string) {
    // Nhớ cache
    const tweet = await TweetCollection.aggregate<TweetSchema>([
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
          _id: 0,
          user_id: 1
        }
      }
    ]).next()
    return (tweet?.user_id as unknown as IUser)?._id || null
  }

  // Thống kê view, link, bookmark trong tuần
  async countViewLinkBookmarkInWeek(user_id: string): Promise<ResCountViewLinkBookmarkInWeek> {
    const now = new Date()

    /**
     * =========================
     * TÍNH THỨ 2 TUẦN NÀY (UTC)
     * =========================
     * getUTCDay():
     *  - CN = 0 → đổi thành 7
     *  - T2 = 1
     */
    const utcDay = now.getUTCDay() || 7

    // Thứ 2 tuần này (00:00 UTC)
    const startOfThisWeek = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - utcDay + 1, 0, 0, 0, 0)
    )

    // Thứ 2 tuần trước
    const startOfLastWeek = new Date(startOfThisWeek)
    startOfLastWeek.setUTCDate(startOfLastWeek.getUTCDate() - 7)

    /* =======================
      1️⃣ VIEW
  ======================== */
    const tweetViewsRaw = await TweetCollection.aggregate([
      {
        $match: {
          user_id: new ObjectId(user_id),
          created_at: { $gte: startOfLastWeek }
        }
      },
      {
        $project: {
          day: { $isoDayOfWeek: '$created_at' }, // 1 = Thứ 2
          views: { $add: ['$user_view', '$guest_view'] },
          isThisWeek: { $gte: ['$created_at', startOfThisWeek] }
        }
      },
      {
        $group: {
          _id: '$day',
          tt: {
            $sum: { $cond: [{ $eq: ['$isThisWeek', false] }, '$views', 0] }
          },
          tn: {
            $sum: { $cond: [{ $eq: ['$isThisWeek', true] }, '$views', 0] }
          }
        }
      },
      { $project: { _id: 0, day: '$_id', tt: 1, tn: 1 } }
    ]).toArray()

    const tweet_views_data = normalizeWeekData(tweetViewsRaw)

    /* =======================
      2️⃣ LIKE (THEO NGÀY LIKE)
  ======================== */
    const tweetLikesRaw = await LikeCollection.aggregate([
      {
        $match: {
          tweet_owner_id: new ObjectId(user_id),
          created_at: { $gte: startOfLastWeek }
        }
      },
      {
        $project: {
          day: { $isoDayOfWeek: '$created_at' }, // 1 = Thứ 2
          isThisWeek: { $gte: ['$created_at', startOfThisWeek] }
        }
      },
      {
        $group: {
          _id: '$day',
          tt: {
            $sum: { $cond: [{ $eq: ['$isThisWeek', false] }, 1, 0] }
          },
          tn: {
            $sum: { $cond: [{ $eq: ['$isThisWeek', true] }, 1, 0] }
          }
        }
      },
      { $project: { _id: 0, day: '$_id', tt: 1, tn: 1 } }
    ]).toArray()

    const tweet_likes_data = normalizeWeekData(tweetLikesRaw)

    /* =======================
      3️⃣ BOOKMARK
  ======================== */
    const tweetBookmarksRaw = await BookmarkCollection.aggregate([
      {
        $match: {
          tweet_owner_id: new ObjectId(user_id),
          created_at: { $gte: startOfLastWeek }
        }
      },
      {
        $project: {
          day: { $isoDayOfWeek: '$created_at' },
          isThisWeek: { $gte: ['$created_at', startOfThisWeek] }
        }
      },
      {
        $group: {
          _id: '$day',
          tt: {
            $sum: { $cond: [{ $eq: ['$isThisWeek', false] }, 1, 0] }
          },
          tn: {
            $sum: { $cond: [{ $eq: ['$isThisWeek', true] }, 1, 0] }
          }
        }
      },
      { $project: { _id: 0, day: '$_id', tt: 1, tn: 1 } }
    ]).toArray()

    const tweet_bookmarks_data = normalizeWeekData(tweetBookmarksRaw)

    /* =======================
      RETURN
  ======================== */
    return {
      tweet_views_count: {
        data: tweet_views_data,
        total_views: tweet_views_data.reduce((s, i) => s + i.tn, 0)
      },
      tweet_likes_count: {
        data: tweet_likes_data,
        total_views: tweet_likes_data.reduce((s, i) => s + i.tn, 0)
      },
      tweet_bookmarks_count: {
        data: tweet_bookmarks_data,
        total_views: tweet_bookmarks_data.reduce((s, i) => s + i.tn, 0)
      }
    }
  }

  // ============================ COMMUNITY ============================
  // Lấy tất cả bài viết trong cộng đồng
  async getCommunityTweets({
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
    const following_user_ids = await FollowsService.getUserFollowing(user_active_id)

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
    } as Filter<TweetSchema>

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
    const tweets = await TweetCollection.aggregate<TweetSchema>([
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
      TweetCollection.countDocuments(match_condition),
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
      items: this.signedCloudfrontMediaUrls(tweets) as TweetSchema[]
    }
  }

  //
  async getCountTweetApprove({ community_id }: { community_id: string }) {
    return await TweetCollection.countDocuments({
      community_id: new ObjectId(community_id),
      status: ETweetStatus.Pending
    })
  }

  // Lấy tất cả bài viết chưa duyệt trong cộng đồng
  async getTweetsPendingByCommunityId({
    query,
    community_id,
    user_active_id
  }: {
    community_id: string
    query: IQuery<ITweet>
    user_active_id: string
  }): Promise<ResMultiType<ITweet>> {
    const { is_admin, is_mentor } = await CommunityService.validateCommunityAndMembership({
      community_id,
      user_id: user_active_id
    })

    //
    if (!is_admin && !is_mentor) {
      throw new BadRequestError('Chỉ chủ sở hữu và điều hành viên mới có quyền xem.')
    }

    //
    const { skip, limit, sort } = getPaginationAndSafeQuery<ITweet>(query)

    const match_condition = {
      community_id: new ObjectId(community_id),
      status: ETweetStatus.Pending
    }

    const tweets = await TweetCollection.aggregate<TweetSchema>([
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
        $project: { user_id: 1, content: 1, medias: 1 }
      }
    ]).toArray()

    const total = await TweetCollection.countDocuments(match_condition)

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: this.signedCloudfrontMediaUrls(tweets) as TweetSchema[]
    }
  }

  //
  signedCloudfrontMediaUrls = (tweets: ITweet[] | ITweet | null) => {
    //
    if (!tweets) return tweets

    //
    if (!Array.isArray(tweets))
      return {
        ...tweets,
        medias: tweets.medias?.map((m) => ({
          ...m,
          ...signedCloudfrontUrl(m)
        })) as any
      }

    //
    return tweets.map((tweet) => ({
      ...tweet,
      medias: tweet.medias?.map((m) => ({
        ...m,
        ...signedCloudfrontUrl(m)
      })) as any
    }))
  }
}

export default new TweetsService()
