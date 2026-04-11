import { ObjectId } from 'mongodb'
import { IBase } from '~/shared/interfaces/base.interface'

export interface IFollower extends IBase {
  user_id: ObjectId // User này sẽ theo dõi followed_user_id
  followed_user_id: ObjectId
}
