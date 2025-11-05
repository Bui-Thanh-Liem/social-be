import { ObjectId } from 'mongodb'
import { notificationQueue } from '~/bull/queues'
import { VideoCollection, VideoSchema } from '~/models/schemas/Video.schema'
import { CONSTANT_JOB } from '~/shared/constants'
import { EVideoStatus } from '~/shared/enums/status.enum'
import { ENotificationType } from '~/shared/enums/type.enum'
import { IPayloadCreateVideo } from '~/shared/interfaces/common/payload-service.interface'
import { deleteVideo } from '~/utils/upload.util'

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
    await notificationQueue.add(CONSTANT_JOB.SEND_NOTI, {
      type: ENotificationType.Other,
      content: 'Video của bạn đã sẵn sàng.',
      receiver: updated?.user_id.toString() || '',
      sender: updated?.user_id.toString() || ''
    })
  }

  async delete(name: string) {
    try {
      await VideoCollection.deleteOne({ name })

      await deleteVideo(name)
    } catch (error) {
      console.log('Tweet - delete - media - video:::', error)
    }
  }
}

export default new VideosService()
