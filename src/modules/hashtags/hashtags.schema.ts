import { Collection, Db } from 'mongodb'
import { BaseSchema } from '~/shared/schemas/base.schema'
import { IHashtag } from '~/shared/interfaces/schemas/hashtag.interface'
import { slug } from '~/utils/slug.util'

export class HashtagsSchema extends BaseSchema implements IHashtag {
  name: string
  slug: string

  constructor(hashtag: Partial<IHashtag>) {
    super()
    this.name = hashtag.name || ''
    this.slug = slug(this.name)
  }
}

export let HashtagsCollection: Collection<HashtagsSchema>

export function initHashtagsCollection(db: Db) {
  HashtagsCollection = db.collection<HashtagsSchema>('hashtags')
}
