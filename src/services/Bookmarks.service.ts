import { ObjectId } from 'mongodb'
import { BookmarkCollection } from '~/models/schemas/Bookmark.schema'
import { ParamIdTweetDto } from '~/shared/dtos/req/tweet.dto'
import { ResToggleBookmark } from '~/shared/dtos/res/bookmark.dto'

class BookmarksService {
  async toggleBookmark(user_id: string, payload: ParamIdTweetDto): Promise<ResToggleBookmark> {
    const user_object_id = new ObjectId(user_id)
    const tweet_object_id = new ObjectId(payload.tweet_id)

    const dataHandle = {
      user_id: user_object_id,
      tweet_id: tweet_object_id
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
    return await BookmarkCollection.deleteMany({ tweet_id: new ObjectId(tweet_id) })
  }
}

export default new BookmarksService()
