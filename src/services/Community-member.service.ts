import { ClientSession, ObjectId } from 'mongodb'
import { CommunityMemberCollection, CommunityMemberSchema } from '~/models/schemas/Community.schema'

class CommunityMemberService {
  async create({ user_id, community_id }: { user_id: string; community_id: string }) {
    const created = await CommunityMemberCollection.insertOne(
      new CommunityMemberSchema({ user_id: new ObjectId(user_id), community_id: new ObjectId(community_id) })
    )

    return !!created.insertedId
  }

  async delete({ user_id, community_id, session }: { user_id: string; community_id: string; session?: ClientSession }) {
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
