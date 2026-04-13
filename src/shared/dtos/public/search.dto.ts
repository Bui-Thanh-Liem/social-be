import { ICommunity } from '~/shared/interfaces/public/community.interface'
import { ITrending } from '~/shared/interfaces/public/trending.interface'
import { IUser } from '~/shared/interfaces/public/user.interface'

export interface ResSearchPending {
  trending: ITrending[]
  users: IUser[]
  communities: ICommunity[]
}
