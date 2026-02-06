import { ObjectId } from 'mongodb'
import { IBase } from '~/shared/interfaces/schemas/base.interface'

export interface IBookmark extends IBase {
  user_id: ObjectId
  tweet_id: ObjectId
  tweet_owner_id: ObjectId
}
