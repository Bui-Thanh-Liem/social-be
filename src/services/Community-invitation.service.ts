import { ObjectId } from 'mongodb'
import pLimit from 'p-limit'
import { CommunityInvitationCollection, CommunityInvitationSchema } from '~/models/schemas/Community.schema'
import { UserCollection } from '~/models/schemas/User.schema'
import { NotFoundError } from '~/shared/classes/error.class'
import { EInvitationStatus } from '~/shared/enums/status.enum'
import { ENotificationType } from '~/shared/enums/type.enum'
import { ICommonPayload } from '~/shared/interfaces/common/community.interface'
import { ICommunity } from '~/shared/interfaces/schemas/community.interface'
import NotificationService from './Notification.service'
const limit = pLimit(10)

class CommunityInvitationService {
  async cerate({ user_id, community, member_ids }: { user_id: string; community: ICommunity; member_ids: string[] }) {
    const userObjId = new ObjectId(user_id)

    //
    const sender = await UserCollection.findOne({ _id: userObjId }, { projection: { name: 1 } })

    if (!sender) {
      throw new NotFoundError()
    }

    const created = await Promise.all(
      member_ids.map((id) =>
        limit(async () => {
          const targetUserId = new ObjectId(id)

          // ✅ Kiểm tra nếu đã có lời mời trước đó
          const alreadyInvited = await CommunityInvitationCollection.findOne({
            user_id: targetUserId,
            community_id: community._id,
            status: EInvitationStatus.Pending // chỉ bỏ qua nếu đang chờ
          })

          if (alreadyInvited) return // 👈 bỏ qua nếu đã tồn tại

          // ✅ Tạo lời mời mới
          const invitation = new CommunityInvitationSchema({
            user_id: targetUserId,
            community_id: community._id
          })

          await Promise.all([
            CommunityInvitationCollection.insertOne(invitation),
            NotificationService.createInQueue({
              content: `${sender.name} đã mời bạn vào cộng đồng ${community.name}.`,
              type: ENotificationType.Community,
              sender: user_id,
              receiver: id,
              refId: community._id?.toString()
            })
          ])
        })
      )
    )

    return created?.length > 0
  }

  async updateStatus(_id: ObjectId, status: EInvitationStatus) {
    await CommunityInvitationCollection.updateOne({ _id: _id }, { $set: { status: status } })
  }

  async getOneByUserIdAndCommunityId({ user_id, community_id }: ICommonPayload) {
    return await CommunityInvitationCollection.findOne({
      user_id: new ObjectId(user_id),
      community_id: new ObjectId(community_id)
    })
  }
}

export default new CommunityInvitationService()
