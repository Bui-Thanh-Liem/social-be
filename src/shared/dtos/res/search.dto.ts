import { ISearchSuggest } from '~/shared/interfaces/schemas/searchSuggest.interface'
import { IUser } from '~/shared/interfaces/schemas/user.interface'

export interface ResSearchPending {
  search: ISearchSuggest[]
  users: IUser[]
}
