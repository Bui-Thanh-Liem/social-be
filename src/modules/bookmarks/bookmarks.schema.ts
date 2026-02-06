import { Collection, Db, ObjectId } from 'mongodb'
import { BaseSchema } from '~/shared/schemas/base.schema'
import { IBookmark } from './bookmarks.interface'

export class BookmarkSchema extends BaseSchema implements IBookmark {
  user_id: ObjectId
  tweet_id: ObjectId
  tweet_owner_id: ObjectId

  constructor(bookmark: Pick<IBookmark, 'user_id' | 'tweet_id' | 'tweet_owner_id'>) {
    super()
    this.user_id = bookmark.user_id || new ObjectId()
    this.tweet_id = bookmark.tweet_id || new ObjectId()
    this.tweet_owner_id = bookmark.tweet_owner_id || new ObjectId()
  }
}

export let BookmarksCollection: Collection<BookmarkSchema>

export function initBookmarksCollection(db: Db) {
  BookmarksCollection = db.collection<BookmarkSchema>('bookmarks')
}
