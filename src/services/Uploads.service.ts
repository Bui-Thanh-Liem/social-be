import { ObjectId } from 'mongodb'
import { BadRequestError } from '~/core/error.response'
import { deleteFromS3, presignedURL } from '~/libs/s3.lib'
import { MediaCollection } from '~/models/schemas/Media.schema'
import { DeleteDto, PresignedUrlDto, UploadConfirmDto } from '~/shared/dtos/req/upload.dto'
import { ResPresignedUrl } from '~/shared/dtos/res/upload.dto'
import { EMediaStatus } from '~/shared/enums/status.enum'
import { getSignedUrl } from '@aws-sdk/cloudfront-signer'
import { envs } from '~/configs/env.config'
import { IMedia } from '~/shared/interfaces/schemas/media.interface'

class UploadsServices {
  //
  async getMultiByKeys(s3_keys: string[]) {
    return await MediaCollection.find({ s3_key: { $in: s3_keys } }).toArray()
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
      console.log('Error creating media:', error)
      throw new BadRequestError('Tạo media thất bại, vui lòng thử lại.')
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
      const medias = await MediaCollection.find({ s3_key: { $in: body.s3_keys } }).toArray()

      // Trả về kèm URL đã ký
      return medias.map((media) => ({
        ...media,
        url: this.signedCloudfrontUrl(media.s3_key)
      }))
    } catch (error) {
      console.log('Error confirming upload:', error)
      throw new BadRequestError('Xác nhận upload thất bại, vui lòng thử lại.')
    }
  }

  //
  async delete(body: DeleteDto) {
    // Xóa file khỏi S3
    await deleteFromS3(body?.s3_keys)

    // Xóa khỏi DB
    await MediaCollection.deleteMany({ s3_key: { $in: body.s3_keys } })

    return true
  }

  //
  signedCloudfrontUrl = (s3_key: string) => {
    return getSignedUrl({
      url: `${envs.AWS_CLOUDFRONT_DOMAIN}/${s3_key}`,
      keyPairId: envs.AWS_CLOUDFRONT_KEY_PAIR_ID,
      privateKey: envs.AWS_CLOUDFRONT_PRIVATE_KEY,
      dateLessThan: new Date(Date.now() + Number(envs.AWS_SIGNED_URL_EXPIRES_IN)).toISOString()
    })
  }
}

export default new UploadsServices()
