import { Collection, Db, ObjectId } from 'mongodb'
import { ISearchSuggest } from '~/shared/interfaces/schemas/searchSuggest.interface'
import { BaseSchema } from './Base.schema'
import { slug } from '~/utils/slug.util'

export class SearchSuggestSchema extends BaseSchema implements ISearchSuggest {
  text?: string | undefined
  slug?: string | undefined
  hashtag: ObjectId
  searchCount: number

  constructor(search: Partial<ISearchSuggest>) {
    super()
    this.text = search.text || ''
    this.hashtag = search.hashtag || new ObjectId()
    this.searchCount = search.searchCount || 1
    if (search.text) this.slug = slug(this.text)
  }
}

export let SearchSuggestCollection: Collection<SearchSuggestSchema>

export function initSearchSuggestCollection(db: Db) {
  SearchSuggestCollection = db.collection<SearchSuggestSchema>('searchSuggests')
}
