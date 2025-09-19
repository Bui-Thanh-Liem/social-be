import { ObjectId } from 'mongodb'
import { HashtagCollection, HashtagSchema } from '~/models/schemas/Hashtag.schema'
import { slug } from '~/utils/slug.util'

class HashtagsService {
  async checkHashtags(names: string[] | undefined) {
    if (!names || names.length === 0) return []
    const results = await Promise.all(
      names.map((name) => {
        const _slug = slug(name)
        return HashtagCollection.findOneAndUpdate(
          { slug: _slug },
          { $setOnInsert: new HashtagSchema({ name }) },
          { upsert: true, returnDocument: 'after' }
        )
      })
    )

    return results.map((result) => result?._id).filter(Boolean) as ObjectId[]
  }
}

export default new HashtagsService()
