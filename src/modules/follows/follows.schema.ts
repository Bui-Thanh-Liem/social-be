import { Collection, Db, ObjectId } from 'mongodb'
import { BaseSchema } from '~/shared/schemas/base.schema'
import { IFollower } from '~/shared/interfaces/schemas/follower.interface'

export class FollowersSchema extends BaseSchema implements IFollower {
  user_id: ObjectId
  followed_user_id: ObjectId

  constructor(follow: Partial<IFollower>) {
    super()
    this.user_id = follow.user_id || new ObjectId()
    this.followed_user_id = follow.followed_user_id || new ObjectId()
  }
}

export let FollowersCollection: Collection<FollowersSchema>

export function initFollowersCollection(db: Db) {
  FollowersCollection = db.collection<FollowersSchema>('followers')
}
