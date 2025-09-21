import { ITrending } from '~/shared/interfaces/schemas/trending.interface'
import { IUser } from '~/shared/interfaces/schemas/user.interface'

export interface ResSearchPending {
  trending: ITrending[]
  users: IUser[]
}
