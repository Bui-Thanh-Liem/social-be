import { Collection, Db, ObjectId } from 'mongodb'
import { ILike } from '~/shared/interfaces/public/like.interface'
import { BaseSchema } from '~/shared/schemas/base.schema'

export const COLLECTION_LIKES_NAME = 'likes'
export class LikesSchema extends BaseSchema implements ILike {
  user_id: ObjectId
  tweet_id: ObjectId
  tweet_owner_id: ObjectId

  constructor(like: Partial<ILike>) {
    super()
    this.user_id = like.user_id || new ObjectId()
    this.tweet_id = like.tweet_id || new ObjectId()
    this.tweet_owner_id = like.tweet_owner_id || new ObjectId()
  }
}

export let LikesCollection: Collection<LikesSchema>

export function initLikesCollection(db: Db) {
  LikesCollection = db.collection<LikesSchema>(COLLECTION_LIKES_NAME)
}
