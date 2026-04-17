import { ObjectId } from 'mongodb'
import { signedCloudfrontUrl } from '~/cloud/aws/cloudfront.aws'
import { BadRequestError, NotFoundError } from '~/core/error.response'
import { clientMongodb } from '~/database/mongodb.db'
import { CreateNotiCommentDto } from '~/shared/dtos/public/notifications.dto'
import { CreateTweetDto, ResCountViewLinkBookmarkInWeek } from '~/shared/dtos/public/tweets.dto'
import cacheService from '~/helpers/cache.helper'
import pessimisticLockServiceInstance from '~/helpers/pessimistic-lock.helper'
import { notificationQueue } from '~/infra/queues'
import { systemQueue } from '~/infra/queues/system.queue'
import { IMedia } from '~/shared/interfaces/common/media.interface'
import { ICommunity } from '~/shared/interfaces/public/community.interface'
import { ITweet } from '~/shared/interfaces/public/tweet.interface'
import { IUser } from '~/shared/interfaces/public/user.interface'
import { BookmarksCollection } from '~/models/public/bookmark.schema'
import { COLLECTION_USERS_NAME, UsersCollection } from '~/models/public/user.schema'
import { ResMultiDto } from '~/shared/dtos/common/res-multi.dto'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ResMultiType } from '~/shared/types/response.type'
import CommentGateway from '~/socket/gateways/Comment.gateway'
import CommunityGateway from '~/socket/gateways/Community.gateway'
import { chunkArray } from '~/utils/chunk-array'
import { convertObjectId } from '~/utils/convert-object-id'
import { createKeyTweetDetails, createKeyTweetDetailsLock, createKeyTweetOnlyUser } from '~/utils/create-key-cache.util'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import { normalizeWeekData } from '~/utils/normalize-week-data.util'
import { ENotificationType } from '../../../shared/enums/public/notifications.enum'
import { EFeedType, ETweetAudience, ETweetStatus, ETweetType } from '../../../shared/enums/public/tweets.enum'
import { ESourceViolation } from '../../../shared/enums/public/user-violations.enum'
import { LikesCollection } from '../../../models/public/like.schema'
import { TweetsCollection, TweetsSchema } from '../../../models/public/tweet.schema'
import userViolationsService from '../../common/user-violations.service'
import badWordsService from '../../private/bad-words.service'
import bookmarksService from '../bookmarks.service'
import CommunitiesService from '../communities.service'
import hashtagsService from '../hashtags.service'
import likesService from '../likes.service'
import trendingService from '../trending.service'
import uploadsService from '../uploads.service'
import { CONSTANT_JOB } from '~/shared/constants/queue.constant'
import { CONSTANT_REGEX } from '~/shared/constants/regex.constant'
import { getNewFeedsHelper } from './helpers/get-new-feeds.helper'
import { getProfileTweetsHelper } from './helpers/get-profile-tweets.helper'
import { adminGetTweetsHelper } from './helpers/admin-get-tweet.helper'
import { getTweetBookmarkedHelper } from './helpers/get-tweet-bookmarked.helper'
import { getTweetLikedHelper } from './helpers/get-tweet-liked.helper'
import { getTweetChildrenHelper } from './helpers/get-tweet-children.helper'
import { getOneByIdHelper } from './helpers/get-one-by-id.helper'
import { getTweetsByCommunityIdHelper } from './helpers/get-tweets-by-community-id.helper'

class TweetsService {
  //
  async create(user_id: string, payload: CreateTweetDto) {
    let message = 'Đăng bài thành công'
    const {
      audience,
      type,
      content,
      parent_id,
      community_id,
      mentions,
      medias,
      bgColor,
      embed_code,
      textColor,
      codes,
      hashtags
    } = payload

    // Lọc từ cấm trong content
    const _content = await badWordsService.detectInText({
      text: content || '',
      user_id
    })

    //
    let _medias: undefined | IMedia[] = undefined
    if (medias) {
      _medias = await uploadsService.getMultiByKeys(medias.map((m) => m.s3_key))
    }

    // Kiểm tra nếu có parent_id
    if (parent_id) {
      const exist = await TweetsCollection.findOne({ _id: new ObjectId(parent_id) })
      if (!exist) {
        throw new NotFoundError('Có lỗi xảy ra vui lòng thử lại.')
      }
    }

    // Tạo hashtags chop tweet
    const _hashtags = await hashtagsService.checkHashtags(hashtags, user_id)

    // Thêm hashtag vào trending
    if (hashtags?.length && type !== ETweetType.Comment) {
      await Promise.all(hashtags.map((hashtagName) => trendingService.createTrending(`#${hashtagName}`, user_id)))
    }

    // Thêm từ khóa vào trending (những từ trong content, nhưng được viết in hoa)
    if (_content && type !== ETweetType.Comment) {
      const keyWords = _content.text.match(CONSTANT_REGEX.FIND_KEYWORD) || []
      await Promise.all(keyWords.map((w) => trendingService.createTrending(w, user_id)))
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
      } = await CommunitiesService.validateCommunityAndMembership({
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
    const newTweet = await TweetsCollection.insertOne(
      new TweetsSchema({
        type: type,
        user_id: new ObjectId(user_id),
        audience: audience,
        hashtags: _hashtags,
        content: _content.text,
        parent_id: parent_id ? new ObjectId(parent_id) : null,
        community_id: community_id ? new ObjectId(community_id) : null,
        mentions: mentions ? mentions.map((id) => new ObjectId(id)) : [],
        medias: _medias?.length ? _medias : medias,
        status: status,
        textColor: textColor || '',
        bgColor: bgColor || '',
        codes: codes || null,
        embed_code: embed_code || ''
      })
    )

    // Lưu vi phạm từ cấm nếu có
    if (_content.bad_words_ids.length > 0) {
      await userViolationsService.create({
        user_id: user_id,
        source: ESourceViolation.Tweet,
        bad_word_ids: _content.bad_words_ids,
        source_id: newTweet.insertedId.toString(),
        final_content: _content.matched_words.join() || ''
      })
    }

    // Mentions
    const sender = await UsersCollection.findOne({ _id: new ObjectId(user_id) }, { projection: { name: 1 } })

    // Gửi thông báo cho ai mà người comment/tweet nhắc đến
    if (mentions?.length) {
      // Nếu nhiều hơn 50 thành viên → tách nhỏ thành nhiều chunk để tránh lỗi payload quá lớn
      const chunks = chunkArray(mentions, 50)
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
      const newTw = await this.getOneById({
        id: newTweet.insertedId.toString(),
        user_active_id: user_id
      })
      if (newTw && parent_id) {
        await CommentGateway.sendNewComment(newTw, parent_id)
      }
    }

    // Gửi thông báo cho điều hành viên của cộng đồng
    if (community_id && community && operatorIds.length > 0) {
      // Nếu nhiều hơn 50 thành viên → tách nhỏ thành nhiều chunk để tránh lỗi payload quá lớn
      const chunks = chunkArray(operatorIds, 50)
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
  async getOneById({ id, user_active_id }: { id: string; user_active_id: string }): Promise<TweetsSchema | null> {
    // 1. Tạo key cache
    const key_cache = createKeyTweetDetails(id)

    // 2. Kiểm tra cache trong Redis trước
    const tweet_cache = await cacheService.get<TweetsSchema>(key_cache)

    // 3. Nếu có cache thì trả về luôn - "null" cũng là 1 giá trị hợp lệ
    if (tweet_cache) {
      console.log('Get in cached')
      return this._processUserSpecificFields(tweet_cache, user_active_id)
    }

    //  4. Thiết lập khóa để tránh thundering herd problem
    const resource = createKeyTweetDetailsLock(id)
    const lockTTL = 10000 // 10 giây
    const lockVal = (Date.now() + lockTTL + 1).toString()
    const lock = await pessimisticLockServiceInstance.acquire(resource, lockVal, lockTTL)

    //.   - Nếu có lock thì mới được truy vấn DB
    if (lock) {
      try {
        // 5. Nếu không có cache thì truy vấn DB
        const tweet_db = await getOneByIdHelper({
          id,
          user_active_id
        })

        //    - Nếu không tìm thấy tweet
        if (!tweet_db) {
          //  - Flow bình thường thì sẽ không có trường hợp này xảy ra
          //  - Trường hợp không tìm thấy tweet, lưu cache null trong 3 giây để tránh tấn công dò tìm id (Anti-DDoS)
          await cacheService.set(key_cache, null, 3) // Negative Caching
          throw new NotFoundError('Bài viết không tồn tại')
        }

        //    - Lưu vào cache với ttl 5 phút
        if (tweet_db.audience === ETweetAudience.Everyone) {
          await cacheService.set(key_cache, tweet_db, 300)
        }

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
      return this.getOneById({
        id,
        user_active_id
      })
    }
  }

  /**
   * @description Hàm tách riêng để xử lý các trường động theo user (is_like, is_bookmark)
   * @param tweet_db Kết quả tweet từ MongoDB Aggregate
   * @param user_active_id ID người dùng đang hoạt động
   * @returns TweetSchema với các trường is_like, is_bookmark đã được thêm vào.
   */
  private _processUserSpecificFields(tweet_db: any, user_active_id: string): TweetsSchema {
    const userActiveObjectId = user_active_id ? new ObjectId(user_active_id) : null

    // Lấy mảng user_id đã like và bookmark từ kết quả Aggregate
    const liked_user_ids = tweet_db.likes.map((like: any) => like.user_id.toString())
    const bookmarked_user_ids = tweet_db.bookmarks.map((bookmark: any) => bookmark.user_id.toString())

    // Kiểm tra và thêm trường mới vào object
    tweet_db.is_like = userActiveObjectId && liked_user_ids.includes(userActiveObjectId.toString())
    tweet_db.is_bookmark = userActiveObjectId && bookmarked_user_ids.includes(userActiveObjectId.toString())

    return this.signedCloudfrontMediaUrls(tweet_db) as TweetsSchema
  }

  //
  async getTweetChildren(payload: {
    id: string
    query: IQuery<ITweet>
    tweet_type: ETweetType
    user_id: string | undefined
  }): Promise<ResMultiType<ITweet>> {
    return await getTweetChildrenHelper(payload)
  }

  // Chỉ có những bài viết không trong cộng đồng
  async getNewFeeds(payload: { feed_type: EFeedType; query: IQuery<ITweet>; user_active_id: string }) {
    return await getNewFeedsHelper(payload)
  }

  //
  async increaseView(tweet_id: ObjectId, user_id: string | null) {
    const inc = user_id ? { user_view: 1 } : { guest_view: 1 }

    const result = await TweetsCollection.findOneAndUpdate(
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
    const keyCache = createKeyTweetOnlyUser(tweet_id)
    const cached = await cacheService.get<TweetsSchema>(keyCache)
    if (cached) {
      return cached
    }

    const tweet = await TweetsCollection.aggregate<TweetsSchema>([
      {
        $match: { _id: new ObjectId(tweet_id) }
      },
      {
        $lookup: {
          from: COLLECTION_USERS_NAME,
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

    await cacheService.set(keyCache, tweet, 300)

    return this.signedCloudfrontMediaUrls(tweet) as TweetsSchema
  }

  // Hàm này dùng để lấy tweets khi truy cập profile của 1 user, chỉ lấy những bài viết có user_id là chủ bài viết
  async getProfileTweets(payload: {
    user_id: string
    isMedia?: boolean
    query: IQuery<ITweet>
    isHighlight?: boolean
    tweet_type: ETweetType
    user_active_id: string
  }) {
    return await getProfileTweetsHelper(payload)
  }

  //
  async getTweetLiked(payload: {
    user_active_id: string
    query: IQuery<TweetsSchema>
  }): Promise<ResMultiType<TweetsSchema>> {
    return await getTweetLikedHelper(payload)
  }

  //
  async getTweetBookmarked(payload: {
    user_active_id: string
    query: IQuery<TweetsSchema>
  }): Promise<ResMultiType<TweetsSchema>> {
    return await getTweetBookmarkedHelper(payload)
  }

  //
  async delete(tweet_id: string) {
    const session = clientMongodb.startSession()
    try {
      await session.withTransaction(async () => {
        // Lấy tweet trước
        const tweet = await TweetsCollection.findOne({ _id: new ObjectId(tweet_id) })

        if (!tweet) {
          throw new NotFoundError('Không tìm thấy bài viết để xóa')
        }

        // Xoá DB trước
        const result = await TweetsCollection.deleteOne({ _id: new ObjectId(tweet_id) })
        if (result.deletedCount === 0) {
          throw new NotFoundError('Không tìm thấy bài viết để xóa')
        }

        // Xóa medias khỏi S3
        if (tweet.medias?.length) {
          await uploadsService.delete({ s3_keys: tweet.medias.map((m) => m.s3_key) })
        }

        // Xóa các record của bookmark/like/comment
        await systemQueue.add(CONSTANT_JOB.DELETE_CHILDREN_TWEET, { parent_id: tweet_id })
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
        TweetsCollection.find(
          { parent_id: new ObjectId(parent_id), type: ETweetType.Comment },
          { projection: { _id: 1 } }
        ).toArray(),
        bookmarksService.deleteByTweetId(parent_id),
        likesService.deleteByTweetId(parent_id)
      ])

      // ********** tránh đệ quy vô tận **********
      if (!children_ids.length) {
        console.log('Không có comment cần xóa')
        return
      }

      // Chia nhỏ để tránh nghẽn — ví dụ mỗi chunk CONSTANT_CHUNK_SIZE tweet
      const ids = children_ids.map((tw) => tw._id.toString())
      const chunks = chunkArray(ids, 50) // Chia thành các chunk nhỏ hơn, ví dụ 500 ids mỗi chunk

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
    const tweet = await TweetsCollection.findOne(
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

    await TweetsCollection.updateOne(
      { _id: new ObjectId(tweet_id) },
      {
        $set: {
          status: status
        }
      }
    )

    return this.signedCloudfrontMediaUrls(tweet) as TweetsSchema
  }

  //
  async getUserIdByTweetId(tweet_id: string) {
    // Nhớ cache
    const tweet = await TweetsCollection.aggregate<TweetsSchema>([
      {
        $match: { _id: new ObjectId(tweet_id) }
      },
      {
        $lookup: {
          from: COLLECTION_USERS_NAME,
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
    if (!user_id) {
      throw new NotFoundError('Không tìm thấy người dùng')
    }

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
    const tweetViewsRaw = await TweetsCollection.aggregate([
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
    const tweetLikesRaw = await LikesCollection.aggregate([
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
    const tweetBookmarksRaw = await BookmarksCollection.aggregate([
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

  // ========== COMMUNITY ==========
  // Lấy tất cả bài viết trong cộng đồng
  async getTweetsByCommunityId(payload: {
    isMedia?: boolean
    community_id: string
    query: IQuery<ITweet>
    isHighlight?: boolean
    user_active_id: string
  }): Promise<ResMultiType<ITweet>> {
    return await getTweetsByCommunityIdHelper(payload)
  }

  // Đếm số bài viết chờ duyệt trong cộng đồng
  async getCountTweetApprove({ community_id }: { community_id: string }) {
    return await TweetsCollection.countDocuments({
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
    const { is_admin, is_mentor } = await CommunitiesService.validateCommunityAndMembership({
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
      {
        $project: { user_id: 1, content: 1, medias: 1 }
      }
    ]).toArray()

    const total = await TweetsCollection.countDocuments(match_condition)

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: this.signedCloudfrontMediaUrls(tweets) as TweetsSchema[]
    }
  }
  // ========== COMMUNITY ==========

  // ========== ADMIN ==========
  async adminGetTweets({
    query,
    admin_id
  }: {
    admin_id: string
    query: IQuery<TweetsSchema>
  }): Promise<ResMultiDto<TweetsSchema>> {
    return await adminGetTweetsHelper({ query, admin_id })
  }

  async adminRemindTweet({
    reason,
    auth_id,
    admin_id,
    tweet_id
  }: {
    auth_id: string
    admin_id: string
    reason: string
    tweet_id: string
  }) {
    //
    await notificationQueue.add(CONSTANT_JOB.SEND_NOTI, {
      content:
        reason ||
        'Quản trị viên đã gửi nhắc nhở về bài viết của bạn. Vui lòng kiểm tra lại nội dung và đảm bảo tuân thủ các quy định.',
      type: ENotificationType.Other,
      sender: auth_id,
      receiver: auth_id
    })
  }

  async adminChangeTweetStatus({
    reason,
    status,
    auth_id,
    tweet_id
  }: {
    reason: string
    auth_id: string
    tweet_id: string
    status: ETweetStatus
  }) {
    const updated = await TweetsCollection.updateOne({ _id: new ObjectId(tweet_id) }, { $set: { status } })

    //
    if (updated.modifiedCount) {
      await notificationQueue.add(CONSTANT_JOB.SEND_NOTI, {
        content: reason || 'Quản trị viên đã thay đổi trạng thái bài viết của bạn.',
        type: ENotificationType.Other,
        sender: auth_id,
        receiver: auth_id
      })
    }
  }

  async adminDeleteTweet({
    reason,
    auth_id,
    admin_id,
    tweet_id
  }: {
    reason: string
    auth_id: string
    admin_id: string
    tweet_id: string
  }) {
    const deleted = await this.delete(tweet_id)

    //
    if (deleted) {
      await notificationQueue.add(CONSTANT_JOB.SEND_NOTI, {
        content: reason || 'Quản trị viên đã xóa bài viết của bạn. ',
        type: ENotificationType.Other,
        sender: auth_id,
        receiver: auth_id
      })
    }
  }
  // ========== ADMIN ==========
}

export default new TweetsService()
