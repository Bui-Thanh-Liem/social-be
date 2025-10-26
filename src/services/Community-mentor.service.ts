import { ClientSession, ObjectId } from 'mongodb'
import {
  CommunityMemberCollection,
  CommunityMemberSchema,
  CommunityMentorCollection
} from '~/models/schemas/Community.schema'
import { BadRequestError } from '~/shared/classes/error.class'

interface ICommonPayload {
  user_id: string
  community_id: string
  session?: ClientSession
}

const MAX_LENGTH_MENTOR = 20
class CommunityMentorService {
  async create({ user_id, community_id, session }: ICommonPayload) {
    const created = await CommunityMemberCollection.insertOne(
      new CommunityMemberSchema({ user_id: new ObjectId(user_id), community_id: new ObjectId(community_id) }),
      { session }
    )

    return !!created.insertedId
  }

  async delete({ user_id, community_id }: ICommonPayload) {
    const deleted = await CommunityMemberCollection.deleteOne({
      user_id: new ObjectId(user_id),
      community_id: new ObjectId(community_id)
    })

    return !!deleted.deletedCount
  }

  async checkLength({ user_id, community_id }: ICommonPayload) {
    const count = await CommunityMentorCollection.countDocuments({
      user_id: new ObjectId(user_id),
      community_id: new ObjectId(community_id)
    })

    if (count >= MAX_LENGTH_MENTOR) {
      throw new BadRequestError(`Đã đạt tối đa số lượng điều hành viên ${MAX_LENGTH_MENTOR}`)
    }
  }
}

export default new CommunityMentorService()
