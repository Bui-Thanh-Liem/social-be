import { ObjectId } from 'mongodb'
import { BadRequestError } from '~/core/error.response'
import { deleteFromS3, presignedURL } from '~/libs/s3.lib'
import { MediaCollection } from '~/models/schemas/Media.schema'
import { DeleteDto, PresignedURLDto, UploadConfirmDto } from '~/shared/dtos/req/upload.dto'
import { EMediaStatus } from '~/shared/enums/status.enum'

class UploadsServices {
  //
  async getMultiByKeys(s3_keys: string[]) {
    return await MediaCollection.find({ s3_key: { $in: s3_keys } }).toArray()
  }

  //
  async presignedURL(body: PresignedURLDto, user_id: string) {
    //
    const { key, presignedUrl } = await presignedURL(body)

    //
    try {
      await MediaCollection.insertOne({
        s3_key: key,
        type: body.fileType,
        file_name: body.fileName,
        status: EMediaStatus.Pending,
        user_id: new ObjectId(user_id),
        size: 0 // Size sẽ được cập nhật sau khi client upload xong và gọi API confirm
      })

      return presignedUrl
    } catch (error) {
      console.log('Error creating media:', error)
      throw new BadRequestError('Tạo media thất bại, vui lòng thử lại.')
    }
  }

  //
  async confirmUpload(body: UploadConfirmDto) {
    try {
      // Cập nhật trạng thái media từ Pending -> Uploaded
      await MediaCollection.updateMany(
        { s3_key: { $in: body.s3_keys, status: EMediaStatus.Pending } },
        { $set: { status: EMediaStatus.Active } }
      )
      return true
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
}

export default new UploadsServices()
