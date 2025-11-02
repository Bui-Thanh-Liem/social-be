import { Collection, Db, ObjectId } from 'mongodb'
import { ETweetAudience } from '~/shared/enums/common.enum'
import { ETweetType } from '~/shared/enums/type.enum'
import { IMedia } from '~/shared/interfaces/common/media.interface'
import { ITweet } from '~/shared/interfaces/schemas/tweet.interface'
import { BaseSchema } from './Base.schema'
import { ETweetStatus } from '~/shared/enums/status.enum'

export class TweetSchema extends BaseSchema implements ITweet {
  user_id: ObjectId
  type: ETweetType
  audience: ETweetAudience
  content: string
  parent_id: ObjectId | null
  hashtags: ObjectId[]
  mentions: ObjectId[]
  media: IMedia | null
  guest_view: number
  user_view: number
  community_id: ObjectId | null
  status: ETweetStatus

  constructor(tweet: Partial<ITweet>) {
    super()
    this.user_id = tweet.user_id || new ObjectId()
    this.type = tweet.type || ETweetType.Tweet
    this.audience = tweet.audience || ETweetAudience.Everyone
    this.content = tweet.content || ''
    this.parent_id = tweet.parent_id || null
    this.hashtags = tweet.hashtags || []
    this.mentions = tweet.mentions || []
    this.media = tweet.media || null
    this.guest_view = tweet.guest_view || 0
    this.user_view = tweet.user_view || 0
    this.community_id = tweet.community_id || null
    this.status = tweet.status || ETweetStatus.Pending
  }
}

export let TweetCollection: Collection<TweetSchema>

export function initTweetCollection(db: Db) {
  TweetCollection = db.collection<TweetSchema>('tweets')
}
