import { Collection, Db, ObjectId } from 'mongodb'
import { ILike } from '~/shared/interfaces/schemas/like.interface'
import { BaseSchema } from './Base.schema'

export class LikeSchema extends BaseSchema implements ILike {
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

export let LikeCollection: Collection<LikeSchema>

export function initLikeCollection(db: Db) {
  LikeCollection = db.collection<LikeSchema>('likes')
}
