import { ObjectId } from 'mongodb'
import { BadRequestError } from '~/core/error.response'
import cacheService from '~/helpers/cache.helper'
import pessimisticLockServiceInstance from '~/helpers/pessimistic-lock.helper'
import { ITweet } from '~/shared/interfaces/public/tweet.interface'
import { IUser } from '~/shared/interfaces/public/user.interface'
import { COLLECTION_BOOKMARKS_NAME } from '~/models/public/bookmark.schema'
import { TrendingCollection, TrendingSchema } from '~/models/public/trending.schema'
import { COLLECTION_USERS_NAME } from '~/models/public/user.schema'
import TweetsService from '~/services/public/tweets/tweets.service'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ResMultiType } from '~/shared/types/response.type'
import {
  createKeyOutStandingThisWeek,
  createKeyTodayTweet,
  createKeyTweetStandingThisWeekLock,
  createKeyTweetTodayLock
} from '~/utils/create-key-cache.util'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import { slug } from '~/utils/slug.util'
import { IResTodayNewsOrOutstanding } from '../../shared/dtos/public/trending.dto'
import { ETweetAudience, ETweetStatus, ETweetType } from '../../shared/enums/public/tweets.enum'
import { ITrending } from '../../shared/interfaces/public/trending.interface'
import { COLLECTION_TWEETS_NAME, TweetsCollection, TweetsSchema } from '../../models/public/tweet.schema'
import followsService from './follows.service'
import hashtagsService from './hashtags.service'
import { COLLECTION_LIKES_NAME } from '~/models/public/like.schema'
import { EUserStatus } from '~/shared/enums/public/users.enum'

class TrendingService {
  // Tạo khi đăng bài - khi tìm kiếm (>=5)
  async createTrending(topic: string, user_id: string) {
    let _hashtag = undefined
    if (topic.includes('#')) {
      const [_id] = await hashtagsService.checkHashtags([topic.replace('#', '').trim()], user_id)
      _hashtag = _id
    }

    // tìm document theo topic hoặc hashtag
    const query: any = {
      $or: []
    }

    // Hiển thị cho người xem là topic còn slug là để tìm kiếm và đồng bộ tìm kiếm, cập nhật dữ liệu
    if (topic && topic.length >= 5) {
      const _slug = slug(topic)
      query.$or.push({ slug: _slug })
    }
    if (_hashtag) query.$or.push({ hashtag: _hashtag })

    // nếu không có topic và hashtag => throw
    if (query.$or.length === 0) {
      console.log('Không tạo trending do không có topic hoặc hashtag')
      return
    }

    await TrendingCollection.findOneAndUpdate(
      query,
      {
        $setOnInsert: {
          topic: topic.replace('#', '').trim(),
          hashtag: _hashtag,
          slug: slug(topic),
          created_at: new Date()
        },
        $inc: { count: 1 }, // tăng nếu tìm thấy
        $currentDate: { updated_at: true }
      },
      { upsert: true, returnDocument: 'after' }
    )

    return true
  }

  // Sử dụng cho what happen (từ khoá hay hashtag tìm kiếm nhiều nhất) (có count mỗi item)
  async getTrending({ query }: { query: IQuery<ITrending> }): Promise<ResMultiType<ITrending>> {
    const { skip, limit, sd, ed, q } = getPaginationAndSafeQuery<ITrending>(query)
    const match = {} as any

    //
    if (sd || ed) {
      match.created_at = {}
      if (sd) match.created_at.$gte = new Date(sd)
      if (ed) match.created_at.$lte = new Date(ed)
    }

    // Kiểm tra tính hợp lệ của sd và ed
    if (sd && ed && sd > ed) {
      throw new BadRequestError('Ngày bắt đầu phải lớn hơn ngày kết thúc')
    }

    //
    let hashtag = ''
    if (q.includes('#')) {
      hashtag = q
    } else {
      match.slug = { $regex: slug(q), $options: 'i' }
    }

    //
    const trending = await TrendingCollection.aggregate<TrendingSchema>([
      { $match: match },
      {
        $lookup: {
          from: 'hashtags',
          localField: 'hashtag',
          foreignField: '_id',
          as: 'hashtag',
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
      { $unwind: { path: '$hashtag', preserveNullAndEmptyArrays: true } },
      ...(hashtag ? [{ $match: { 'hashtag.name': hashtag } }] : []),
      { $sort: { count: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]).toArray()

    //
    const total_agg = await TrendingCollection.aggregate([
      {
        $lookup: {
          from: 'hashtags',
          localField: 'hashtag',
          foreignField: '_id',
          as: 'hashtag',
          pipeline: [{ $project: { name: 1 } }]
        }
      },
      { $unwind: { path: '$hashtag', preserveNullAndEmptyArrays: false } },
      ...(hashtag ? [{ $match: { 'hashtag.name': hashtag } }] : []),
      { $count: 'total' }
    ]).toArray()

    const total = total_agg[0]?.total || 0

    return { total, total_page: Math.ceil(total / limit), items: trending }
  }

  // (cache, pessimistic lock) => sử dụng vòng lặp để dễ dàng quản lý số lần thử lại
  async getTodayNews({
    query,
    user_id
  }: {
    query: IQuery<ITrending>
    user_id: string
  }): Promise<IResTodayNewsOrOutstanding[]> {
    // 1.
    const key_cache = createKeyTodayTweet()

    // 2.
    const tweet_cache = await cacheService.get<IResTodayNewsOrOutstanding[]>(key_cache)

    // 3.
    if (tweet_cache) {
      console.log('Get in cached - Today news')
      return tweet_cache
    }

    // 4.
    const resource = createKeyTweetTodayLock()
    const lockTTL = 10000 // 10 giây
    const lockVal = (Date.now() + lockTTL + 1).toString()
    let retries = 0
    const maxRetries = 50 // ~5 giây (100ms mỗi lần)

    //
    while (retries < maxRetries) {
      const lock = await pessimisticLockServiceInstance.acquire(resource, lockVal, lockTTL)
      // 5.
      if (lock) {
        try {
          const result = await this._getTodayNews({ query, user_id })
          await cacheService.set(key_cache, result, 300) // 5 phút
          return result
        } catch (error) {
          throw new BadRequestError('Có lỗi xảy ra vui lòng thử lại.')
        } finally {
          // 6. Dù thành công hay lỗi thì cũng phải release lock
          const lockValue = await pessimisticLockServiceInstance.isLocked(resource)
          if (lockValue) {
            await pessimisticLockServiceInstance.release(resource, lockVal)
          }
        }
      } else {
        // Nếu không lấy được lock thì chờ 100ms
        await new Promise((resolve) => setTimeout(resolve, 100))
        retries++
      }
    }

    // Nếu hết retry thì fallback về cache cũ (nếu có) hoặc throw
    const fallback = await cacheService.get<IResTodayNewsOrOutstanding[]>(key_cache)
    if (fallback) return fallback
    throw new BadRequestError('Hệ thống đang bận, vui lòng thử lại sau vài giây.')
  }

  // Sử dụng cho today news (từ khoá hay hashtag tìm kiếm nhiều nhất tuần không tính ngày hôm qua)
  // Lấy trending topic/hashtag xu hướng  (query: page: 1, limit: 20)
  // Dùng trending lấy (1000) tweets thỏa topics/hashtags nổi bật hôm nay (nhiều lượt like/view)
  // Rồi group (trên node) theo topic/hashtag , trả về cho client
  private async _getTodayNews({
    query,
    user_id
  }: {
    query: IQuery<ITrending>
    user_id: string
  }): Promise<IResTodayNewsOrOutstanding[]> {
    // Today range
    const start_day = new Date()
    start_day.setHours(0, 0, 0, 0)
    const end_day = new Date()
    end_day.setHours(23, 59, 59, 999)

    // Trending data
    const trending = await this.getTrending({
      query: { ...query, sd: start_day, ed: end_day }
    })

    //
    const [trending_topics, trending_hashtags] = trending.items.reduce<[string[], ObjectId[]]>(
      (acc, current) => {
        if (current?.topic) {
          acc[0].push(current.topic)
        }

        if (current?.hashtag) {
          acc[1].push((current.hashtag as any)._id)
        }

        return acc
      },
      [[], []]
    )

    // Build search string (OR mode)
    const searchString = trending_topics.join(' ')

    // Base pipeline for $lookup, $addFields, $sort, $project
    const basePipeline = [
      { $limit: 500 },
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
      { $unwind: { path: '$user_id', preserveNullAndEmptyArrays: true } },
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
                    { $eq: ['$user_id', new ObjectId(user_id)] }
                  ]
                }
              }
            }
          ],
          as: 'userFollowCheck'
        }
      },
      // 👇 thêm isFollow vào trong user_id
      {
        $addFields: {
          'user_id.isFollow': { $gt: [{ $size: '$userFollowCheck' }, 0] }
        }
      },
      {
        $lookup: {
          from: COLLECTION_BOOKMARKS_NAME,
          localField: '_id',
          foreignField: 'tweet_id',
          as: 'likes',
          pipeline: [{ $project: { user_id: 1 } }]
        }
      },
      {
        $addFields: {
          likes_count: { $size: '$likes' },
          total_views: { $add: ['$user_view', '$guest_view'] }
        }
      },
      {
        $sort: {
          likes_count: -1,
          total_views: -1
        }
      },
      {
        $project: {
          _id: 1,
          content: 1,
          medias: 1,
          user_id: 1,
          hashtags: 1,
          created_at: 1,
          userFollowCheck: 1
        }
      }
    ]

    // Query 1: Text search (if searchString exists)
    const textSearchTweets = searchString
      ? await TweetsCollection.aggregate<ITweet>([
          {
            $match: {
              $text: { $search: searchString },
              created_at: { $gte: start_day, $lte: end_day },
              audience: ETweetAudience.Everyone,
              community_id: { $eq: null },
              status: ETweetStatus.Ready
            }
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
              'author.status.status': { $ne: EUserStatus.Hidden }
            }
          },
          // ----------------------------------------------

          {
            $addFields: {
              score: { $meta: 'textScore' }
            }
          },
          {
            $sort: {
              score: { $meta: 'textScore' }
            }
          },
          ...basePipeline
        ]).toArray()
      : []

    // Query 2: Hashtag search (if trending_hashtags exists)
    const hashtagTweets = trending_hashtags.length
      ? await TweetsCollection.aggregate<ITweet>([
          {
            $match: {
              hashtags: { $in: trending_hashtags },
              created_at: { $gte: start_day, $lte: end_day },
              audience: ETweetAudience.Everyone,
              community_id: { $eq: null },
              status: ETweetStatus.Ready
            }
          },
          ...basePipeline
        ]).toArray()
      : []

    // Merge and deduplicate tweets
    const tweets = [...textSearchTweets, ...hashtagTweets].filter(
      (tweet, index, self) => index === self.findIndex((t) => t._id?.equals(tweet._id))
    )

    console.log('Get in database - Today news')
    return this.grouped(trending.items, TweetsService.signedCloudfrontMediaUrls(tweets) as ITweet[], 'Tin tức')
  }

  // (cache, pessimistic lock) => sử dụng vòng lặp để dễ dàng quản lý số lần thử lại
  async getOutStandingThisWeekNews({
    query,
    user_id
  }: {
    query: IQuery<ITrending>
    user_id: string
  }): Promise<IResTodayNewsOrOutstanding[]> {
    // 1.
    const key_cache = createKeyOutStandingThisWeek()

    // 2.
    const tweet_cache = await cacheService.get<IResTodayNewsOrOutstanding[]>(key_cache)

    // 3.
    if (tweet_cache) {
      console.log('Get in cached - Outstanding this week')
      return tweet_cache
    }

    // 4.
    const resource = createKeyTweetStandingThisWeekLock()
    const lockTTL = 10000 // 10 giây
    const lockVal = (Date.now() + lockTTL + 1).toString()
    let retries = 0
    const maxRetries = 50 // ~5 giây (100ms mỗi lần)

    //
    while (retries < maxRetries) {
      const lock = await pessimisticLockServiceInstance.acquire(resource, lockVal, lockTTL)
      // 5.
      if (lock) {
        try {
          const result = await this._getOutStandingThisWeekNews({ query, user_id })
          await cacheService.set(key_cache, result, 300) // 5 phút
          return result
        } catch (error) {
          throw new BadRequestError('Có lỗi xảy ra vui lòng thử lại.')
        } finally {
          // 6. Dù thành công hay lỗi thì cũng phải release lock
          const lockValue = await pessimisticLockServiceInstance.isLocked(resource)
          if (lockValue) {
            await pessimisticLockServiceInstance.release(resource, lockVal)
          }
        }
      } else {
        // Nếu không lấy được lock thì chờ 100ms
        await new Promise((resolve) => setTimeout(resolve, 100))
        retries++
      }
    }

    // Nếu hết retry thì fallback về cache cũ (nếu có) hoặc throw
    const fallback = await cacheService.get<IResTodayNewsOrOutstanding[]>(key_cache)
    if (fallback) return fallback
    throw new BadRequestError('Hệ thống đang bận, vui lòng thử lại sau vài giây.')
  }

  //
  private async _getOutStandingThisWeekNews({ query, user_id }: { query: IQuery<ITrending>; user_id: string }) {
    // Today range
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const end_day = new Date(today)
    end_day.setMilliseconds(-1) // 23:59:59.999 hôm qua

    const start_day = new Date(today)
    start_day.setDate(today.getDate() - 7) // cách đây 7 ngày
    start_day.setHours(0, 0, 0, 0)

    // Trending data
    const trending = await this.getTrending({
      query: { ...query, sd: start_day, ed: end_day }
    })

    //
    const [trending_topics, trending_hashtags] = trending.items.reduce<[string[], ObjectId[]]>(
      (acc, current) => {
        if (current?.topic) {
          acc[0].push(current.topic)
        }

        if (current?.hashtag) {
          acc[1].push((current.hashtag as any)._id)
        }

        return acc
      },
      [[], []]
    )

    // Build search string (OR mode)
    const search_string = trending_topics.join(' ')

    // Base pipeline for $lookup, $addFields, $sort, $project
    const basePipeline = [
      { $limit: 500 },
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
      { $unwind: { path: '$user_id', preserveNullAndEmptyArrays: true } },
      // 👇 thêm isFollow vào trong user_id
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
                    { $eq: ['$user_id', new ObjectId(user_id)] }
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
          from: COLLECTION_LIKES_NAME,
          localField: '_id',
          foreignField: 'tweet_id',
          as: 'likes',
          pipeline: [{ $project: { user_id: 1 } }]
        }
      },
      {
        $addFields: {
          likes_count: { $size: '$likes' },
          total_views: { $add: ['$user_view', '$guest_view'] }
        }
      },
      {
        $sort: {
          likes_count: -1,
          total_views: -1
        }
      },
      {
        $project: {
          _id: 1,
          content: 1,
          medias: 1,
          user_id: 1,
          hashtags: 1,
          created_at: 1
        }
      }
    ]

    // Query 1: Text search (if searchString exists)
    const textSearchTweets = search_string
      ? await TweetsCollection.aggregate<ITweet>([
          {
            $match: {
              $text: { $search: search_string },
              created_at: { $gte: start_day, $lte: end_day },
              audience: ETweetAudience.Everyone,
              community_id: { $eq: null },
              status: ETweetStatus.Ready
            }
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
              'author.status.status': { $ne: EUserStatus.Hidden }
            }
          },
          // ----------------------------------------------

          {
            $addFields: {
              score: { $meta: 'textScore' }
            }
          },
          {
            $sort: {
              score: { $meta: 'textScore' }
            }
          },
          ...basePipeline
        ]).toArray()
      : []

    // Query 2: Hashtag search (if trending_hashtags exists)
    const hashtagTweets = trending_hashtags.length
      ? await TweetsCollection.aggregate<ITweet>([
          {
            $match: {
              hashtags: { $in: trending_hashtags },
              created_at: { $gte: start_day, $lte: end_day },
              audience: ETweetAudience.Everyone,
              community_id: { $eq: null },
              status: ETweetStatus.Ready
            }
          },
          ...basePipeline
        ]).toArray()
      : []

    // Merge and deduplicate tweets
    const tweets = [...textSearchTweets, ...hashtagTweets].filter(
      (tweet, index, self) => index === self.findIndex((t) => t._id?.equals(tweet._id))
    )

    console.log('Get in database - Outstanding this week')

    return this.grouped(trending.items, tweets, 'Nổi bật')
  }

  //
  private grouped(trending: ITrending[], tweets: ITweet[], category: string): IResTodayNewsOrOutstanding[] {
    if (!trending?.length || !tweets?.length) return []

    // Dùng Set để tránh trùng tweet giữa các trending
    const usedTweetIds = new Set<string>()

    const grouped = trending.flatMap((t) => {
      const t_key = t.topic || ''
      const t_hashtag = t?.hashtag

      // Lọc tweet có liên quan và chưa dùng
      const related_tweets = tweets.filter((tw) => {
        const matched =
          (t_key && tw.content.toLocaleLowerCase().includes(t_key.toLocaleLowerCase())) ||
          (t_hashtag && tw.hashtags.some((h) => h.equals?.(t_hashtag)))

        return matched && !usedTweetIds.has(tw._id!.toString())
      })

      // Đánh dấu tweet đã dùng
      related_tweets.forEach((tw) => usedTweetIds.add(tw._id!.toString()))

      if (!related_tweets.length) return []

      const relatedTweet = related_tweets.length

      // Lấy tweet nổi bật nhất (mới nhất)
      const highlight_tweet = [...related_tweets]
        .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
        .slice(0, relatedTweet > 4 ? 3 : 2)

      // Danh sách người dùng highlight (unique theo user_id)
      const highlight = Array.from(
        new Map(
          highlight_tweet.map((tw) => {
            const u = tw.user_id as unknown as IUser
            return [
              (tw.user_id as any)._id?.toString(),
              {
                content: tw.content,
                created_at: tw.created_at,
                _id: u._id,
                name: u.name,
                avatar: u.avatar,
                verify: u.verify,
                username: u.username,
                cover_photo: u.cover_photo,
                day_of_birth: u.day_of_birth,
                location: u.location,
                website: u.website,
                bio: u.bio,
                isFollow: u.isFollow
              }
            ]
          })
        ).values()
      )

      return {
        trending: t,
        category: category,
        media: highlight_tweet[0].medias?.[0],
        posts: relatedTweet,
        id: highlight_tweet[0]._id as unknown,
        time: highlight_tweet[0].created_at,
        relevant_ids: related_tweets.map((tw) => tw._id),
        highlight: highlight
      } as unknown as IResTodayNewsOrOutstanding
    })

    return grouped
  }

  //
  async cleanupOldTrending() {
    try {
      const latest100 = await TrendingCollection.find({})
        .sort({ created_at: -1 })
        .limit(100)
        .project({ _id: 1 })
        .toArray()

      const keepIds = latest100.map((t) => t._id)

      await TrendingCollection.deleteMany({
        _id: { $nin: keepIds }
      })
    } catch (error) {
      console.error('[CRON-15D] ❌ Cleanup trending failed', error)
    }
  }

  //
  async getTweetsByIds({ query, user_active_id }: { query: IQuery<ITweet>; user_active_id: string }) {
    //
    const { ids } = query
    const { sort } = getPaginationAndSafeQuery<ITweet>(query)

    let safe_ids = typeof ids === 'object' ? [...ids] : []
    if (typeof ids === 'string') {
      safe_ids = [...(ids as any).split(',')]
    }

    //
    const followed_user_ids = await followsService.getUserFollowing(user_active_id)
    followed_user_ids.push(user_active_id)

    // condition
    const match_condition = {
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
      ],
      status: ETweetStatus.Ready
    } as any

    //
    const tweets = await TweetsCollection.aggregate<TweetsSchema>([
      {
        $match: match_condition
      },
      {
        $match: { type: { $ne: ETweetType.Comment }, _id: { $in: safe_ids.map((id) => new ObjectId(id)) } }
      },
      {
        $sort: sort
      },
      {
        $skip: 0
      },
      {
        $limit: safe_ids.length
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
    const _ids = tweets.map((tweet) => tweet._id as ObjectId)
    const date = new Date()
    await TweetsCollection.updateMany(
      {
        _id: {
          $in: _ids
        }
      },
      {
        $inc: { user_view: 1 },
        $set: {
          updated_at: date
        }
      }
    )

    //
    tweets.forEach((tweet) => {
      tweet.updated_at = date
      if (user_active_id) {
        tweet.user_view += 1
      } else {
        tweet.guest_view += 1
      }
    })

    return TweetsService.signedCloudfrontMediaUrls(tweets)
  }

  //
  async report(id: string) {
    await TrendingCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $inc: { count: -1 }, // giảm khi bị báo cáo
        $currentDate: { updated_at: true }
      }
    )
    return true
  }

  //
  async cleanupWeakTrending() {
    try {
      const now = new Date()
      const threeDaysAgo = new Date(now)
      threeDaysAgo.setDate(now.getDate() - 3)

      await TrendingCollection.deleteMany({
        created_at: { $gte: threeDaysAgo },
        count: { $lt: 10 }
      })
    } catch (error) {
      console.error('[CRON-3D] ❌ Cleanup weak trending failed', error)
    }
  }
}

export default new TrendingService()
