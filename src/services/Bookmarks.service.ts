import { ObjectId } from 'mongodb'
import { BookmarkCollection } from '~/models/schemas/Bookmark.schema'
import { ToggleBookmarkDto } from '~/shared/dtos/req/bookmark.dto'
import { ResToggleBookmark } from '~/shared/dtos/res/bookmark.dto'

class BookmarksService {
  async toggleBookmark(user_id: string, payload: ToggleBookmarkDto): Promise<ResToggleBookmark> {
    const userObjectId = new ObjectId(user_id)
    const tweetObjectId = new ObjectId(payload.tweet_id)

    const dataHandle = {
      user_id: userObjectId,
      tweet_id: tweetObjectId
    }

    const deleted = await BookmarkCollection.findOneAndDelete(dataHandle)

    if (deleted?._id) {
      return { status: 'UnBookmark', _id: deleted._id.toString() }
    } else {
      const inserted = await BookmarkCollection.insertOne(dataHandle)
      return { status: 'Bookmark', _id: inserted.insertedId.toString() }
    }
  }

  async deleteByTweetId(tweet_id: string) {
    await BookmarkCollection.deleteMany({ tweet_id: new ObjectId(tweet_id) })
    return true
  }
}

export default new BookmarksService()
