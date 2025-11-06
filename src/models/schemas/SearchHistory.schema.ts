import { Collection, Db, ObjectId } from 'mongodb'
import { ISearchHistory } from '~/shared/interfaces/schemas/search-history.interface'
import { BaseSchema } from './Base.schema'

export class SearchHistorySchema extends BaseSchema implements ISearchHistory {
  user: ObjectId | undefined

  //
  text: string | undefined
  trending: ObjectId | undefined
  owner: ObjectId

  constructor(sh: Partial<ISearchHistory>) {
    super()
    this.owner = sh.owner || new ObjectId()

    //
    this.text = sh.text || undefined
    this.trending = sh.trending || undefined
    this.user = sh.user || undefined
  }
}

export let SearchHistoryCollection: Collection<SearchHistorySchema>

export function initSearchHistoryCollection(db: Db) {
  SearchHistoryCollection = db.collection<SearchHistorySchema>('search-history')
}
