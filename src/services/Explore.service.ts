import { ObjectId } from 'mongodb'
import { TrendingCollection, TrendingSchema } from '~/models/schemas/Trending.schema'
import { TweetCollection } from '~/models/schemas/Tweet.schema'
import { BadRequestError } from '~/shared/classes/error.class'
import { IResTodayNews } from '~/shared/dtos/res/explore.dto'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ITrending } from '~/shared/interfaces/schemas/trending.interface'
import { ITweet } from '~/shared/interfaces/schemas/tweet.interface'
import { IUser } from '~/shared/interfaces/schemas/user.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'
import { slug } from '~/utils/slug.util'
import HashtagsService from './Hashtags.service'

class ExploreService {
  // Tạo khi đăng bài - khi tìm kiếm
  async createTrending(keyword: string) {
    let _hashtag = undefined
    if (keyword.includes('#')) {
      const [_id] = await HashtagsService.checkHashtags([keyword.replace('#', '').trim()])
      _hashtag = _id
    }

    // tìm document theo keyword hoặc hashtag
    const query: any = {
      $or: []
    }

    // Hiển thị cho người xem là keyword còn slug là để tìm kiếm và đồng bộ tìm kiếm, cập nhật dữ liệu
    if (keyword && keyword.length >= 3) {
      const _slug = slug(keyword)
      query.$or.push({ slug: _slug })
    }
    if (_hashtag) query.$or.push({ hashtag: _hashtag })

    // nếu không có keyword và hashtag => throw
    if (query.$or.length === 0) {
      console.log('Payload phải có ít nhất key hoặc hashtag')
      return
    }

    await TrendingCollection.findOneAndUpdate(
      query,
      {
        $setOnInsert: { keyword, hashtag: _hashtag, slug: slug(keyword), created_at: new Date() },
        $inc: { count: 1 }, // tăng nếu tìm thấy
        $currentDate: { updated_at: true }
      },
      { upsert: true, returnDocument: 'after' }
    )

    return true
  }

  // Sử dụng cho card what happen (từ khoá hay hashtag tìm kiếm nhiều nhất)
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
                name: 1
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

  // Sử dụng cho card today news (từ khoá hay hashtag tìm kiếm nhiều nhất)
  // Lấy trending keyword/hash xu hướng  (query: page: 1, limit: 20)
  // Dùng trending lấy (500) tweets thỏa keywords/hashtags nổi bật hôm nay (nhiều lượt like/view)
  // Rồi group (trên node) theo keyword/hashtag , trả về cho client
  async getTodayNews({ query }: { query: IQuery<ITrending> }): Promise<IResTodayNews[]> {
    // Today range
    const startDay = new Date()
    startDay.setHours(0, 0, 0, 0)
    const endDay = new Date()
    endDay.setHours(23, 59, 59, 999)

    // Trending data
    const trending = await this.getTrending({
      query: { ...query, sd: startDay, ed: endDay }
    })
    console.log('trending.items.length', trending.items.length)

    //
    const [trending_keywords, trending_hashtags] = trending.items.reduce<[string[], ObjectId[]]>(
      (acc, current) => {
        if (current?.keyword) {
          acc[0].push(current.keyword)
        }

        if (current?.hashtag) {
          acc[1].push((current.hashtag as any)._id)
        }

        return acc
      },
      [[], []]
    )

    console.log('trending_keywords::', trending_keywords)
    console.log('trending_hashtags::', trending_hashtags)

    // Build search string (OR mode)
    const searchString = trending_keywords.join(' ')

    // Base pipeline for $lookup, $addFields, $sort, $project
    const basePipeline = [
      { $limit: 500 },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user_id',
          pipeline: [{ $project: { avatar: 1 } }]
        }
      },
      { $unwind: { path: '$user_id', preserveNullAndEmptyArrays: true } },
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

    // console.log('textSearchTweets.length', textSearchTweets.length)
    // console.log('hashtagTweets.length', hashtagTweets.length)
    // console.log('tweets.length', tweets.length)

    return this.grouped(trending.items, tweets)
  }

  private grouped(trending: ITrending[], tweets: ITweet[]): IResTodayNews[] {
    if (!trending?.length || !tweets?.length) return []

    const grouped = trending.flatMap((t) => {
      //
      const t_key = t.keyword || ''
      const t_hashtag = t?.hashtag

      //
      const relatedTweets = tweets.filter(
        (tw) =>
          (t_key && tw.content.toLocaleLowerCase().includes(t_key.toLocaleLowerCase())) ||
          (t_hashtag && tw.hashtags.some((h) => h.equals?.(t_hashtag)))
      )

      if (!relatedTweets.length) return []

      const highlighTweet = relatedTweets[0]

      return {
        trending: t,
        category: 'Tin tức',
        media: highlighTweet.media,
        posts: relatedTweets.length,
        id: highlighTweet._id as any,
        title: highlighTweet.content,
        time: highlighTweet.created_at,
        avatars: relatedTweets.slice(0, 3).map((tw) => (tw.user_id as unknown as IUser).avatar)
      } as IResTodayNews
    })

    return grouped
  }

  // Sẽ xóa các trending cũ trong vòng 30 ngày và có count ít hơn 10
}

export default new ExploreService()
