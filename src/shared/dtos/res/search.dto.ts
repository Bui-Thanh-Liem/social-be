import { ICommunity } from '~/modules/communities/communities.interface'
import { ITrending } from '~/modules/trending/trending.interface'
import { IUser } from '~/modules/users/users.interface'

export interface ResSearchPending {
  trending: ITrending[]
  users: IUser[]
  communities: ICommunity[]
}
