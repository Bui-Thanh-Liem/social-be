import { ObjectId } from 'mongodb'
import { NotFoundError } from '~/core/error.response'
import { BookmarksCollection } from '~/schemas/public/bookmark.schema'
import TweetsService from '~/services/public/tweets/tweets.service'
import { ResToggleBookmark } from '../../shared/dtos/public/bookmarks.dto'

class BookmarksService {
  async toggleBookmark(user_id: string, id: string): Promise<ResToggleBookmark> {
    const user_object_id = new ObjectId(user_id)
    const tweet_object_id = new ObjectId(id)

    //
    const tweet_owner_id = await TweetsService.getUserIdByTweetId(id)
    if (!tweet_owner_id) {
      throw new NotFoundError('Bài viết không tồn tại')
    }

    const dataHandle = {
      user_id: user_object_id,
      tweet_id: tweet_object_id
    }

    const deleted = await BookmarksCollection.findOneAndDelete(dataHandle)

    if (deleted?._id) {
      return { status: 'UnBookmark', _id: deleted._id.toString() }
    } else {
      const inserted = await BookmarksCollection.insertOne({
        ...dataHandle,
        tweet_owner_id: tweet_owner_id,
        created_at: new Date()
      })
      return { status: 'Bookmark', _id: inserted.insertedId.toString() }
    }
  }

  async deleteByTweetId(tweet_id: string) {
    return await BookmarksCollection.deleteMany({ tweet_id: new ObjectId(tweet_id) })
  }
}

export default new BookmarksService()
