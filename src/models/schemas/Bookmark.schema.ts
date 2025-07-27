import { Collection, Db, ObjectId } from 'mongodb'
import { IBookmark } from '~/shared/interfaces/schemas/bookmark.interface'
import { BaseSchema } from './Base.schema'

export class BookmarkSchema extends BaseSchema implements IBookmark {
  user_id: ObjectId
  tweet_id: ObjectId

  constructor(bookmark: Partial<IBookmark>) {
    super()
    this.user_id = bookmark.user_id || new ObjectId()
    this.tweet_id = bookmark.tweet_id || new ObjectId()
  }
}

export let BookmarkCollection: Collection<BookmarkSchema>

export function initBookmarkCollection(db: Db) {
  BookmarkCollection = db.collection<BookmarkSchema>('bookmarks')
}
