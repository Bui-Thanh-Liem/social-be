import { ICommunity } from '~/interfaces/public/communities.interface'
import { ITrending } from '~/interfaces/public/trending.interface'
import { IUser } from '~/interfaces/public/users.interface'

export interface ResSearchPending {
  trending: ITrending[]
  users: IUser[]
  communities: ICommunity[]
}
