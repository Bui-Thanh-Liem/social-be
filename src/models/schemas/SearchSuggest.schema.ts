import { Collection, Db, ObjectId } from 'mongodb'
import { ISearchSuggest } from '~/shared/interfaces/schemas/searchSuggest.interface'
import { BaseSchema } from './Base.schema'

export class SearchSuggestSchema extends BaseSchema implements ISearchSuggest {
  text: string
  hashtag: ObjectId
  searchCount: number

  constructor(search: Partial<ISearchSuggest>) {
    super()
    this.text = search.text || ''
    this.hashtag = search.hashtag || new ObjectId()
    this.searchCount = search.searchCount || 1
  }
}

export let SearchSuggestCollection: Collection<SearchSuggestSchema>

export function initSearchSuggestCollection(db: Db) {
  SearchSuggestCollection = db.collection<SearchSuggestSchema>('searchSuggests')
}
