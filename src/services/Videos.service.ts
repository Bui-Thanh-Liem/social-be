import { ObjectId } from 'mongodb'
import { VideoCollection, VideoSchema } from '~/models/schemas/Video.schema'
import { EVideoStatus } from '~/shared/enums/status.enum'
import { IPayloadCreateVideo } from '~/shared/interfaces/common/payload-service.interface'
import NotificationService from './Notification.service'
import { ENotificationType } from '~/shared/enums/type.enum'

class VideosService {
  async create(payload: IPayloadCreateVideo) {
    const result = await VideoCollection.insertOne(
      new VideoSchema({
        ...payload,
        status: EVideoStatus.Pending
      })
    )

    return result
  }

  async changeStatus(id: string, status: EVideoStatus) {
    const updated = await VideoCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          status
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: { user_id: 1 }
      }
    )

    //
    await NotificationService.create({
      type: ENotificationType.VERIFY,
      content: 'Video của bạn đã kiểm duyệt thành công.',
      receiver: updated?.user_id.toString() || '',
      sender: updated?.user_id.toString() || ''
    })
  }

  async delete(name: string) {
    await VideoCollection.deleteOne({ name })
  }
}

export default new VideosService()
