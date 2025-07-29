import { ObjectId } from 'mongodb'
import { CreateTweetDto } from '~/shared/dtos/req/tweet.dto'
import { TweetCollection, TweetSchema } from '~/models/schemas/Tweet.schema'
import HashtagsService from './Hashtags.service'

class TweetsService {
  async create(user_id: string, payload: CreateTweetDto) {
    const hashtags = await HashtagsService.checkHashtags(payload.hashtags)

    const result = await TweetCollection.insertOne(
      new TweetSchema({
        user_id: new ObjectId(user_id),
        type: payload.type,
        audience: payload.audience,
        hashtags: hashtags,
        content: payload.content,
        parent_id: new ObjectId(payload.parent_id),
        mentions: payload.mentions ? payload.mentions?.map((id) => new ObjectId(id)) : [],
        medias: payload.medias
      })
    )
    return result
  }

  async getOneById(tweet_id: string) {
    const result = await TweetCollection.aggregate([
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
        $addFields: {
          bookmark_count: { $size: '$bookmarks' }
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
          like_count: { $size: '$likes' }
        }
      }
      // {
      //   $project: {
      //     'user_id.password': 0,
      //     'user_id.email_verify_token': 0,
      //     'user_id.forgot_password_token': 0,
      //     'user_id.verify': 0,
      //     'user_id.created_at': 0,
      //     'user_id.updated_at': 0,
      //     'user_id.location': 0,
      //     'user_id.website': 0,
      //     'user_id.bio': 0,
      //     'user_id.day_of_birth': 0,

      //     //
      //     'hashtags.created_at': 0,
      //     'hashtags.updated_at': 0
      //   }
      // }
    ]).next()

    return result
  }
}

export default new TweetsService()
