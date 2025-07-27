import { Collection, Db } from 'mongodb'
import { IHashtag } from '~/shared/interfaces/schemas/hashtag.interface'
import { BaseSchema } from './Base.schema'

export class HashtagSchema extends BaseSchema implements IHashtag {
  name: string

  constructor(hashtag: Partial<IHashtag>) {
    super()
    this.name = hashtag.name || ''
  }
}

export let HashtagCollection: Collection<HashtagSchema>

export function initHashtagCollection(db: Db) {
  HashtagCollection = db.collection<HashtagSchema>('hashtags')
}
