import { ObjectId } from 'mongodb'
import { TrendingCollection, TrendingSchema } from '~/models/schemas/Trending.schema'
import { TweetCollection } from '~/models/schemas/Tweet.schema'
import { BadRequestError } from '~/shared/classes/error.class'
import { IResTodayNewsOrOutstanding } from '~/shared/dtos/res/trending.dto'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ITrending } from '~/shared/interfaces/schemas/trending.interface'
import { ITweet } from '~/shared/interfaces/schemas/tweet.interface'
import { IUser } from '~/shared/interfaces/schemas/user.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'
import { slug } from '~/utils/slug.util'
import HashtagsService from './Hashtags.service'

class TrendingService {
  // Tạo khi đăng bài - khi tìm kiếm (>=5)
  async createTrending(topic: string) {
    let _hashtag = undefined
    if (topic.includes('#')) {
      const [_id] = await HashtagsService.checkHashtags([topic.replace('#', '').trim()])
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
    const totalAgg = await TrendingCollection.aggregate([
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

    const total = totalAgg[0]?.total || 0

    return { total, total_page: Math.ceil(total / limit), items: trending }
  }

  // Sử dụng cho today news (từ khoá hay hashtag tìm kiếm nhiều nhất tuần không tính ngày hôm qua)
  // Lấy trending topic/hashtag xu hướng  (query: page: 1, limit: 20)
  // Dùng trending lấy (1000) tweets thỏa topics/hashtags nổi bật hôm nay (nhiều lượt like/view)
  // Rồi group (trên node) theo topic/hashtag , trả về cho client
  async getTodayNews({
    query,
    user_id
  }: {
    query: IQuery<ITrending>
    user_id: string
  }): Promise<IResTodayNewsOrOutstanding[]> {
    // Today range
    const startDay = new Date()
    startDay.setHours(0, 0, 0, 0)
    const endDay = new Date()
    endDay.setHours(23, 59, 59, 999)

    // Trending data
    const trending = await this.getTrending({
      query: { ...query, sd: startDay, ed: endDay }
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
          pipeline: [{ $project: { avatar: 1, name: 1, username: 1, verify: 1 } }]
        }
      },
      { $unwind: { path: '$user_id', preserveNullAndEmptyArrays: true } },
      // 👇 thêm isFollow vào trong user_id
      {
        $addFields: {
          'user_id.isFollow': {
            $in: [new ObjectId(user_id), '$followers.user_id']
          }
        }
      },
      {
        $lookup: {
          from: 'likes',
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
          media: 1,
          user_id: 1,
          hashtags: 1,
          created_at: 1
        }
      }
    ]

    // Query 1: Text search (if searchString exists)
    const textSearchTweets = searchString
      ? await TweetCollection.aggregate<ITweet>([
          {
            $match: {
              $text: { $search: searchString },
              created_at: { $gte: startDay, $lte: endDay },
              audience: ETweetAudience.Everyone
            }
          },
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
      ? await TweetCollection.aggregate<ITweet>([
          {
            $match: {
              hashtags: { $in: trending_hashtags },
              created_at: { $gte: startDay, $lte: endDay },
              audience: ETweetAudience.Everyone
            }
          },
          ...basePipeline
        ]).toArray()
      : []

    // Merge and deduplicate tweets
    const tweets = [...textSearchTweets, ...hashtagTweets].filter(
      (tweet, index, self) => index === self.findIndex((t) => t._id?.equals(tweet._id))
    )

    return this.grouped(trending.items, tweets, 'Tin tức')
  }

  async getOutStandingThisWeekNews({
    query,
    user_id
  }: {
    query: IQuery<ITrending>
    user_id: string
  }): Promise<IResTodayNewsOrOutstanding[]> {
    // Today range
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const endDay = new Date(today)
    endDay.setMilliseconds(-1) // 23:59:59.999 hôm qua

    const startDay = new Date(today)
    startDay.setDate(today.getDate() - 7) // cách đây 7 ngày
    startDay.setHours(0, 0, 0, 0)

    // Trending data
    const trending = await this.getTrending({
      query: { ...query, sd: startDay, ed: endDay }
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
          from: 'followers',
          localField: 'user_id',
          foreignField: 'followed_user_id',
          as: 'followers'
        }
      },
      {
        $lookup: {
          from: 'followers',
          localField: 'user_id',
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
          pipeline: [{ $project: { avatar: 1, name: 1, username: 1, verify: 1 } }]
        }
      },
      { $unwind: { path: '$user_id', preserveNullAndEmptyArrays: true } },
      // 👇 thêm isFollow vào trong user_id
      {
        $addFields: {
          'user_id.isFollow': {
            $in: [new ObjectId(user_id), '$followers.user_id']
          }
        }
      },
      {
        $lookup: {
          from: 'likes',
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
          media: 1,
          user_id: 1,
          hashtags: 1,
          created_at: 1
        }
      }
    ]

    // Query 1: Text search (if searchString exists)
    const textSearchTweets = searchString
      ? await TweetCollection.aggregate<ITweet>([
          {
            $match: {
              $text: { $search: searchString },
              created_at: { $gte: startDay, $lte: endDay },
              audience: ETweetAudience.Everyone
            }
          },
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
      ? await TweetCollection.aggregate<ITweet>([
          {
            $match: {
              hashtags: { $in: trending_hashtags },
              created_at: { $gte: startDay, $lte: endDay },
              audience: ETweetAudience.Everyone
            }
          },
          ...basePipeline
        ]).toArray()
      : []

    // Merge and deduplicate tweets
    const tweets = [...textSearchTweets, ...hashtagTweets].filter(
      (tweet, index, self) => index === self.findIndex((t) => t._id?.equals(tweet._id))
    )

    return this.grouped(trending.items, tweets, 'Nổi bật')
  }

  private grouped(trending: ITrending[], tweets: ITweet[], category: string): IResTodayNewsOrOutstanding[] {
    if (!trending?.length || !tweets?.length) return []

    const grouped = trending.flatMap((t) => {
      //
      const t_key = t.topic || ''
      const t_hashtag = t?.hashtag

      //
      const relatedTweets = tweets.filter(
        (tw) =>
          (t_key && tw.content.toLocaleLowerCase().includes(t_key.toLocaleLowerCase())) ||
          (t_hashtag && tw.hashtags.some((h) => h.equals?.(t_hashtag)))
      )

      if (!relatedTweets.length) return []

      const relatedTweet = relatedTweets.length
      const highlightTweet = [...relatedTweets]
        .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
        .slice(0, relatedTweet > 4 ? 3 : 2)

      return {
        trending: t,
        category: category,
        media: highlightTweet[0].media,
        posts: relatedTweet,
        id: highlightTweet[0]._id as any,
        time: highlightTweet[0].created_at,
        relevantIds: relatedTweets.map((tw) => tw._id),
        highlight: highlightTweet.map((tw) => ({
          content: tw.content,
          created_at: tw.created_at,
          _id: (tw.user_id as unknown as IUser)._id,
          name: (tw.user_id as unknown as IUser).name,
          avatar: (tw.user_id as unknown as IUser).avatar,
          verify: (tw.user_id as unknown as IUser).verify,
          username: (tw.user_id as unknown as IUser).username,
          isFollow: (tw.user_id as unknown as IUser).isFollow
        }))
      } as IResTodayNewsOrOutstanding
    })

    return grouped
  }

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
