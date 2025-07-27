import { ObjectId } from 'mongodb'
import { ToggleBookmarkDto } from '~/dtos/requests/bookmark.dto'
import { BookmarkCollection } from '~/models/schemas/Bookmark.schema'

class BookmarksService {
  async toggleBookmark(user_id: string, payload: ToggleBookmarkDto) {
    const userObjectId = new ObjectId(user_id)
    const tweetObjectId = new ObjectId(payload.tweet_id)

    const dataHandle = {
      user_id: userObjectId,
      tweet_id: tweetObjectId
    }

    const deleted = await BookmarkCollection.findOneAndDelete(dataHandle)

    if (deleted?._id) {
      return { status: 'UnBookmark', _id: deleted._id }
    } else {
      const inserted = await BookmarkCollection.insertOne(dataHandle)
      return { status: 'Bookmark', _id: inserted.insertedId }
    }
  }
}

export default new BookmarksService()
