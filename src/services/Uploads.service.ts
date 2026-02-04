import { ObjectId } from 'mongodb'
import { notificationQueue } from '~/bull/queues'
import { BadRequestError, NotFoundError } from '~/core/error.response'
import { signedCloudfrontUrl } from '~/libs/cloudfront.lib'
import { deleteFromS3, presignedURL } from '~/libs/s3.lib'
import { MediaCollection } from '~/models/schemas/Media.schema'
import { CONSTANT_JOB } from '~/shared/constants'
import { DeleteMediaDto, PresignedUrlDto, UploadConfirmDto } from '~/shared/dtos/req/upload.dto'
import { ResPresignedUrl } from '~/shared/dtos/res/upload.dto'
import { EMediaStatus } from '~/shared/enums/status.enum'
import { ENotificationType } from '~/shared/enums/type.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { IMedia } from '~/shared/interfaces/schemas/media.interface'
import { IUser } from '~/shared/interfaces/schemas/user.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'

class UploadsServices {
  //
  async getMultiByKeys(s3_keys: string[]) {
    return await MediaCollection.find({ s3_key: { $in: s3_keys }, status: EMediaStatus.Active }).toArray()
  }

  //
  async presignedURL(body: PresignedUrlDto, user_id: string): Promise<ResPresignedUrl> {
    //
    const { key, presigned_url } = await presignedURL(body)

    //
    try {
      await MediaCollection.insertOne({
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
      await MediaCollection.updateMany(
        {
          s3_key: { $in: body.s3_keys },
          status: EMediaStatus.Pending
        },
        {
          $set: { status: EMediaStatus.Active }
        }
      )

      // Lấy thông tin media đã được upload
      const medias = await MediaCollection.find(
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
    // Xóa file khỏi S3
    await deleteFromS3(body?.s3_keys)

    // Xóa khỏi DB
    await MediaCollection.deleteMany({ s3_key: { $in: body.s3_keys } })

    return true
  }

  // ====== ADMIN ONLY ======
  async getMulti({ admin_id, query }: { admin_id: string; query: IQuery<IMedia> }): Promise<ResMultiType<IMedia>> {
    const { skip, limit, sort } = getPaginationAndSafeQuery<IMedia>(query)

    const [items, total] = await Promise.all([
      MediaCollection.aggregate<IMedia>([
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_id',
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  avatar: 1,
                  username: 1
                }
              }
            ]
          }
        },
        {
          $unwind: {
            path: '$user_id',
            preserveNullAndEmptyArrays: true
          }
        }
      ]).toArray(),
      MediaCollection.countDocuments()
    ])

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: this.signedCloudfrontUrls(items) as unknown as IMedia[]
    }
  }
  async remind({ admin_id, media_id }: { admin_id: string; media_id: string }) {
    //
    const media = await MediaCollection.findOne({ _id: new ObjectId(media_id) })
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
  // ========================

  signedCloudfrontUrls = (medias: IMedia[] | IMedia | null) => {
    //
    if (!medias) return medias

    //
    if (!Array.isArray(medias)) {
      const user = medias.user_id as unknown as IUser
      return {
        ...medias,
        ...signedCloudfrontUrl(medias),
        user_id: user?.avatar
          ? {
              ...user,
              avatar: signedCloudfrontUrl(user.avatar)
            }
          : null
      }
    }

    //
    return medias.map((media) => {
      const user = media.user_id as unknown as IUser
      return {
        ...media,
        ...signedCloudfrontUrl(media),
        user_id: user?.avatar
          ? {
              ...user,
              avatar: signedCloudfrontUrl(user.avatar)
            }
          : null
      }
    })
  }
}

export default new UploadsServices()
