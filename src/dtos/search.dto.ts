import { ICommunity } from '~/interfaces/communities.interface'
import { ITrending } from '~/interfaces/trending.interface'
import { IUser } from '~/interfaces/users.interface'

export interface ResSearchPending {
  trending: ITrending[]
  users: IUser[]
  communities: ICommunity[]
}
