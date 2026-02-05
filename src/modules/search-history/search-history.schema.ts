import { Collection, Db, ObjectId } from 'mongodb'
import { BaseSchema } from '~/shared/schemas/base.schema'
import { ISearchHistory } from '~/shared/interfaces/schemas/search-history.interface'

export class SearchHistorySchema extends BaseSchema implements ISearchHistory {
  user: ObjectId | undefined

  //
  owner: ObjectId
  text: string | undefined
  trending: ObjectId | undefined
  community: ObjectId | undefined

  constructor(sh: Partial<ISearchHistory>) {
    super()
    this.owner = sh.owner || new ObjectId()

    //
    this.user = sh.user || undefined
    this.text = sh.text || undefined
    this.trending = sh.trending || undefined
    this.community = sh.community || undefined
  }
}

export let SearchHistoryCollection: Collection<SearchHistorySchema>

export function initSearchHistoryCollection(db: Db) {
  SearchHistoryCollection = db.collection<SearchHistorySchema>('search-histories')
}
