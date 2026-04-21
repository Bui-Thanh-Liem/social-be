import { IUser } from '../public/user.interface'

export interface IHandleNewsFeedType {
  kol: Pick<IUser, '_id' | 'name' | 'username' | 'avatar'>
}
