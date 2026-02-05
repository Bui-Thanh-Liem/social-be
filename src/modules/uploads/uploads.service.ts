import { ObjectId } from 'mongodb'
import { notificationQueue } from '~/infra/queues'
import { BadRequestError, NotFoundError } from '~/core/error.response'
import { signedCloudfrontUrl } from '~/cloud/aws/cloudfront.aws'
import { deleteFromS3, presignedURL } from '~/cloud/aws/s3.aws'
import { CONSTANT_JOB } from '~/shared/constants'
import { DeleteMediaDto, PresignedUrlDto, UploadConfirmDto } from '~/modules/uploads/uploads.dto'
import { ResPresignedUrl } from '~/shared/dtos/res/upload.dto'
import { EMediaStatus } from '~/shared/enums/status.enum'
import { ENotificationType } from '~/shared/enums/type.enum'
import { IMedia } from '~/shared/interfaces/schemas/media.interface'
import { MediasCollection } from '../media/media.schema'

class UploadsServices {
  //
  async getMultiByKeys(s3_keys: string[]) {
    return await MediasCollection.find({ s3_key: { $in: s3_keys }, status: EMediaStatus.Active }).toArray()
  }

  //
  async presignedURL(body: PresignedUrlDto, user_id: string): Promise<ResPresignedUrl> {
    //
    const { key, presigned_url } = await presignedURL(body)

    //
    try {
      await MediasCollection.insertOne({
        s3_key: key,
        file_type: body.file_type,
        file_name: body.file_name,
        status: EMediaStatus.Pending,
        user_id: new ObjectId(user_id),
        file_size: body.file_size
      })

      return { key, presigned_url }
    } catch (error) {
      console.log('Error creating medias:', error)
      throw new BadRequestError('Tạo medias thất bại, vui lòng thử lại.')
    }
  }

  //
  async confirmUpload(body: UploadConfirmDto): Promise<IMedia[]> {
    try {
      // Cập nhật trạng thái media từ Pending -> Active
      await MediasCollection.updateMany(
        {
          s3_key: { $in: body.s3_keys },
          status: EMediaStatus.Pending
        },
        {
          $set: { status: EMediaStatus.Active }
        }
      )

      // Lấy thông tin media đã được upload
      const medias = await MediasCollection.find(
        { s3_key: { $in: body.s3_keys } },
        {
          projection: {
            s3_key: 1,
            url: 1
          }
        }
      ).toArray()

      // Trả về kèm URL đã ký
      return medias.map((media) => ({
        ...media,
        ...signedCloudfrontUrl(media)
      }))
    } catch (error) {
      console.log('Error confirming upload:', error)
      throw new BadRequestError('Xác nhận tải lên ảnh/video thất bại.')
    }
  }

  //
  async delete(body: DeleteMediaDto) {
    const media = await MediasCollection.findOne({ s3_key: body.s3_keys[0] })
    if (!media) throw new NotFoundError('Hình ảnh / video không tồn tại')

    // Xóa file khỏi S3
    const deletedToS3 = await deleteFromS3(body?.s3_keys)

    // Xóa khỏi DB
    const deletedFromDb = await MediasCollection.deleteMany({ s3_key: { $in: body.s3_keys } })

    // Kiểm tra
    if (!deletedToS3 || deletedFromDb.deletedCount === 0) {
      throw new BadRequestError('Xoá ảnh/ video thất bại, vui lòng thử lại.')
    }

    return media
  }

  // ====== ADMIN ONLY ======

  async remind({ admin_id, media_id }: { admin_id: string; media_id: string }) {
    //
    const media = await MediasCollection.findOne({ _id: new ObjectId(media_id) })
    if (!media) throw new NotFoundError('Hình ảnh / video không tồn tại')

    // Send noti
    await notificationQueue.add(CONSTANT_JOB.SEND_NOTI, {
      content: `Hình ảnh / video của bạn đã vi phạm chính sách. vui lòng kiểm tra và chỉnh sửa lại!`,
      type: ENotificationType.Other,
      sender: admin_id,
      receiver: media.user_id?.toString(),
      ref_id: media._id.toString()
    })
  }
  async deleteByAdmin({ admin_id, body }: { body: DeleteMediaDto; admin_id: string }) {
    const deleted = await this.delete(body)
    notificationQueue.add(CONSTANT_JOB.SEND_NOTI, {
      content: 'Ảnh/ video của bạn đã bị xoá bởi Admin vì vi phạm chính sách cộng đồng.',
      receiver: deleted.user_id?.toString(),
      sender: admin_id,
      type: ENotificationType.Other
    })
  }
  // ========================
}

export default new UploadsServices()
