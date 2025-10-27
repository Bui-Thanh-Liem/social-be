import { ClientSession } from 'mongodb'

export interface ICommonPayload {
  user_id: string
  community_id: string
  session?: ClientSession
}
