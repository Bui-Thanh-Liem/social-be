import { Collection, Db, ObjectId } from 'mongodb'
import { ITrending } from '~/shared/interfaces/schemas/trending.interface'
import { BaseSchema } from './Base.schema'
import { slug } from '~/utils/slug.util'

export class TrendingSchema extends BaseSchema implements ITrending {
  keyword?: string | undefined
  slug?: string | undefined
  hashtag: ObjectId
  count: number

  constructor(search: Partial<ITrending>) {
    super()
    this.keyword = search.keyword || ''
    this.hashtag = search.hashtag || new ObjectId()
    this.count = search.count || 1
    if (search.keyword) this.slug = slug(this.keyword)
  }
}

export let TrendingCollection: Collection<TrendingSchema>

export function initTrendingCollection(db: Db) {
  TrendingCollection = db.collection<TrendingSchema>('trending')
}
