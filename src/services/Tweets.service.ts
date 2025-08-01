import { ObjectId } from 'mongodb'
import { TweetCollection, TweetSchema } from '~/models/schemas/Tweet.schema'
import { CreateTweetDto } from '~/shared/dtos/req/tweet.dto'
import { ITweet } from '~/shared/interfaces/schemas/tweet.interface'
import HashtagsService from './Hashtags.service'

class TweetsService {
  async create(user_id: string, payload: CreateTweetDto) {
    const { audience, type, content, parent_id, mentions, medias } = payload
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
        medias: medias
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
                cover_photo: 1
              }
            }
          ]
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
        $unwind: {
          path: '$user_id', // chuyển đổi array sang object
          preserveNullAndEmptyArrays: true // nếu user bị xóa vẫn trả về tweet - user_id: null
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
          from: 'likes', // collection chứa bookmark
          localField: '_id', // _id của tweet
          foreignField: 'tweet_id', // field trong bookmark trỏ đến tweet
          as: 'likes', // tên array chứa kết quả
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
          guest_view: 1
        }
      }
    )

    return result as Pick<ITweet, 'guest_view' | 'user_view'>
  }
}

export default new TweetsService()
