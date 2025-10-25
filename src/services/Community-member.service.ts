import { ObjectId } from 'mongodb';
import { CommunityMemberCollection, CommunityMemberSchema } from '~/models/schemas/Community.schema';

class CommunityMemberService {
  async create({ user_id, community_id }: { user_id: string; community_id: string }) {
    await CommunityMemberCollection.insertOne(
      new CommunityMemberSchema({ user_id: new ObjectId(user_id), community_id: new ObjectId(community_id) })
    )

    return true
  }
}

export default new CommunityMemberService()
