import { ObjectId } from 'mongodb'
import { CommunityMemberCollection, CommunityMemberSchema } from '~/models/schemas/Community.schema'
import { ICommonPayload } from '~/shared/interfaces/common/community.interface'

class CommunityMemberService {
  async create({ user_id, community_id }: ICommonPayload) {
    const created = await CommunityMemberCollection.insertOne(
      new CommunityMemberSchema({ user_id: new ObjectId(user_id), community_id: new ObjectId(community_id) })
    )

    return !!created.insertedId
  }

  async delete({ user_id, community_id, session }: ICommonPayload) {
    const deleted = await CommunityMemberCollection.deleteOne(
      {
        user_id: new ObjectId(user_id),
        community_id: new ObjectId(community_id)
      },
      { session }
    )

    return !!deleted.deletedCount
  }
}

export default new CommunityMemberService()
