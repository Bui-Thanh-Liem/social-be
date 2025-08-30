import { ObjectId } from 'mongodb'
import { VideoCollection, VideoSchema } from '~/models/schemas/Video.schema'
import { EVideoStatus } from '~/shared/enums/status.enum'
import { IPayloadCreateVideo } from '~/shared/interfaces/common/payload-service.interface'

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
    return await VideoCollection.findOneAndUpdate(
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
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
  }
}

export default new VideosService()
