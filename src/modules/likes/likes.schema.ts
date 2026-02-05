import { Collection, Db, ObjectId } from 'mongodb'
import { BaseSchema } from '~/schemas/Base.schema'
import { ILike } from '~/shared/interfaces/schemas/like.interface'

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
  LikesCollection = db.collection<LikesSchema>('likes')
}
