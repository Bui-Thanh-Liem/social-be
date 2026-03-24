import { ObjectId } from 'mongodb'
import { CreateUserViolationsDto } from '../dtos/user-violations.dto'
import { UserViolationSchema, UserViolationsCollection } from '../models/user-violations.schema'

class UserViolationsService {
  async create(payload: CreateUserViolationsDto) {
    return await UserViolationsCollection.insertOne(
      new UserViolationSchema({
        source: payload.source,
        final_content: payload.final_content,
        user_id: new ObjectId(payload.user_id),
        source_id: new ObjectId(payload.source_id),
        bad_word_ids: payload.bad_word_ids.map((id) => new ObjectId(id))
      })
    )
  }
}

export default new UserViolationsService()
