import { ObjectId } from 'mongodb'
import { ConflictError } from '~/core/error.response'
import { CreateAccessRecentDto } from './access-recent.dto'
import { AccessRecentCollection, AccessRecentSchema } from './access-recent.schema'

class AccessRecentService {
  async create({ body }: { body: CreateAccessRecentDto }) {
    const { ref_id, user_id, ref_slug } = body
    const refIdObjectId = new ObjectId(ref_id)
    const userIdObjectId = new ObjectId(user_id)

    //
    const exists = await AccessRecentCollection.findOne({
      ref_id: refIdObjectId,
      user_id: userIdObjectId
    })
    if (exists) throw new ConflictError('Từ cấm đã tồn tại')

    const newBadWord = await AccessRecentCollection.insertOne(
      new AccessRecentSchema({
        type: body.type,
        ref_slug: ref_slug,
        ref_id: refIdObjectId,
        user_id: userIdObjectId
      })
    )
    return newBadWord
  }
}

export default new AccessRecentService()
