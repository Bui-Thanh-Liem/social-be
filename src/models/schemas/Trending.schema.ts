import { Collection, Db, ObjectId } from 'mongodb'
import { ITrending } from '~/shared/interfaces/schemas/trending.interface'
import { BaseSchema } from './Base.schema'
import { slug } from '~/utils/slug.util'

export class TrendingSchema extends BaseSchema implements ITrending {
  topic?: string | undefined
  slug?: string | undefined
  hashtag: ObjectId
  count: number

  constructor(search: Partial<ITrending>) {
    super()
    this.topic = search.topic || ''
    this.hashtag = search.hashtag || new ObjectId()
    this.count = search.count || 1
    if (search.topic) this.slug = slug(this.topic)
  }
}

export let TrendingCollection: Collection<TrendingSchema>

export function initTrendingCollection(db: Db) {
  TrendingCollection = db.collection<TrendingSchema>('trending')
}
