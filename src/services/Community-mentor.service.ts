import { ObjectId } from 'mongodb'
import { CommunityMentorCollection, CommunityMentorSchema } from '~/models/schemas/Community.schema'
import { BadRequestError } from '~/core/error.reponse'
import { CONSTANT_MAX_LENGTH_MENTOR } from '~/shared/constants'
import { ICommonPayload } from '~/shared/interfaces/common/community.interface'

class CommunityMentorService {
  async create({ user_id, community_id, session }: ICommonPayload) {
    const created = await CommunityMentorCollection.insertOne(
      new CommunityMentorSchema({ user_id: new ObjectId(user_id), community_id: new ObjectId(community_id) }),
      { session }
    )

    return !!created.insertedId
  }

  async delete({ user_id, community_id, session }: ICommonPayload) {
    const deleted = await CommunityMentorCollection.deleteOne(
      {
        user_id: new ObjectId(user_id),
        community_id: new ObjectId(community_id)
      },
      { session }
    )

    return !!deleted.deletedCount
  }

  async checkLength({ user_id, community_id }: ICommonPayload) {
    const count = await CommunityMentorCollection.countDocuments({
      user_id: new ObjectId(user_id),
      community_id: new ObjectId(community_id)
    })

    if (count >= CONSTANT_MAX_LENGTH_MENTOR) {
      throw new BadRequestError(`Đã đạt tối đa số lượng điều hành viên ${CONSTANT_MAX_LENGTH_MENTOR}`)
    }
  }
}

export default new CommunityMentorService()
