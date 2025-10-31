import { ClientSession } from 'mongodb'
import { IUser } from '../schemas/user.interface'

export interface ICommonPayload {
  user?: IUser
  user_id: string
  community_id: string
  session?: ClientSession
}
