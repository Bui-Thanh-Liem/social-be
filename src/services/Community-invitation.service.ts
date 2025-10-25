import { ObjectId } from 'mongodb'
import pLimit from 'p-limit'
import {
  CommunityCollection,
  CommunityInvitationCollection,
  CommunityInvitationSchema,
  CommunityMentorCollection
} from '~/models/schemas/Community.schema'
import { UserCollection } from '~/models/schemas/User.schema'
import { BadRequestError } from '~/shared/classes/error.class'
import { InvitationMembersDto } from '~/shared/dtos/req/community.dto'
import { EInvitationStatus } from '~/shared/enums/status.enum'
import { EMembershipType, ENotificationType } from '~/shared/enums/type.enum'
import NotificationService from './Notification.service'
const limit = pLimit(10)

class CommunityInvitationService {
  // Hàm này sẽ được worker gọi
  async invite({ user_id, payload }: { user_id: string; payload: InvitationMembersDto }) {
    const { member_ids, community_id } = payload
    const userObjId = new ObjectId(user_id)
    const communityObjId = new ObjectId(community_id)

    const community = await CommunityCollection.findOne(
      { _id: communityObjId },
      { projection: { name: 1, membershipType: 1, admin: 1 } }
    )

    if (community?.membershipType === EMembershipType.Invite_only) {
      const isMentor = await CommunityMentorCollection.findOne({
        community_id: communityObjId,
        user_id: userObjId
      })

      if (!isMentor && !(community.admin as unknown as ObjectId).equals(user_id)) {
        throw new BadRequestError('Bạn không có quyền mời thành viên vào cộng đồng.')
      }
    }

    //
    const sender = await UserCollection.findOne({ _id: userObjId }, { projection: { name: 1 } })

    // Dừng nếu thiếu dữ liệu
    if (!sender || !community) {
      throw new BadRequestError('Invalid sender or community')
    }

    await Promise.all(
      member_ids.map((id) =>
        limit(async () => {
          const targetUserId = new ObjectId(id)

          // ✅ Kiểm tra nếu đã có lời mời trước đó
          const alreadyInvited = await CommunityInvitationCollection.findOne({
            user_id: targetUserId,
            community_id: communityObjId,
            status: EInvitationStatus.Pending // chỉ bỏ qua nếu đang chờ
          })

          if (alreadyInvited) return // 👈 bỏ qua nếu đã tồn tại

          // ✅ Tạo lời mời mới
          const invitation = new CommunityInvitationSchema({
            user_id: targetUserId,
            community_id: communityObjId
          })

          await Promise.all([
            CommunityInvitationCollection.insertOne(invitation),
            NotificationService.create({
              content: `${sender.name} đã mời bạn vào cộng đồng ${community.name}.`,
              type: ENotificationType.Community,
              sender: user_id,
              receiver: id,
              refId: community_id
            })
          ])
        })
      )
    )

    return true
  }

  async updateStatus(_id: ObjectId) {
    await CommunityInvitationCollection.updateOne({ _id: _id }, { $set: { status: EInvitationStatus.Accepted } })
  }

  async getOneByUserIdAndCommunityId({ user_id, community_id }: { user_id: string; community_id: string }) {
    return await CommunityInvitationCollection.findOne({
      user_id: new ObjectId(user_id),
      community_id: new ObjectId(community_id)
    })
  }
}

export default new CommunityInvitationService()
