import { Request } from 'express'
import fs from 'fs'
import path from 'path'
import cloudinary from '~/configs/cloudinary.config'
import { envs } from '~/configs/env.config'
import { BadRequestError } from '~/core/error.response'
import { deleteFromCloudinary, uploadToCloudinary } from '~/libs/cloudinary.lib'
import { UPLOAD_IMAGE_FOLDER_PATH } from '~/shared/constants'
import { SignedDto } from '~/shared/dtos/req/upload.dto'
import { EMediaType } from '~/shared/enums/type.enum'
import { IMedia } from '~/shared/interfaces/common/media.interface'
import { logger } from '~/utils/logger.util'
import { uploadImages, uploadVideos } from '~/utils/upload.util'

class UploadsService {
  async uploadImages(req: Request): Promise<IMedia[]> {
    const urls = await uploadImages(req)
    return urls.map((url) => ({ resource_type: EMediaType.Image, url, public_id: path.basename(url) }))
  }

  async uploadVideos(req: Request): Promise<IMedia[]> {
    const urls = await uploadVideos(req)
    return urls.map((url) => ({ resource_type: EMediaType.Video, url, public_id: path.basename(url) }))
  }

  async uploadToCloudinary(req: Request): Promise<IMedia[]> {
    const uploaded = await uploadToCloudinary(req)
    return uploaded.map((file) => ({
      url: file.url,
      public_id: file.public_id,
      resource_type: file.resource_type as unknown as EMediaType
    }))
  }

  async deleteFromCloudinary(media: IMedia[]) {
    //
    const deleteResults = await deleteFromCloudinary(media)

    //
    const failed = deleteResults.filter((r) => !r.deleted)
    if (failed.length > 0) {
      console.warn('Không xóa được một số file:', failed)
    }

    //
    return true
  }

  async signedUrls({ public_data_signed }: { public_data_signed: SignedDto }): Promise<IMedia[]> {
    if (!public_data_signed || !Array.isArray(public_data_signed) || public_data_signed.length === 0) {
      throw new BadRequestError('public_data_signed thì phải là một mảng không rỗng')
    }

    return public_data_signed.map((x) => {
      const url = cloudinary.url(x.public_id, {
        secure: true, // luôn dùng HTTPS
        sign_url: true, // bắt buộc ký
        expires_at: Math.floor(Date.now() / 1000) + 900, // hết hạn sau 15 phút
        resource_type: x.resource_type || 'auto' // tự nhận diện image/video/raw
      })

      return {
        url,
        resource_type: (x.resource_type as unknown as EMediaType) || EMediaType.Image,
        public_id: x.public_id
      }
    })
  }

  async removeImages(urls: string[]) {
    return new Promise((resolve, reject) => {
      try {
        // Validate that the image URLs are provided
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
          return reject(new BadRequestError('No image URLs provided'))
        }

        // Process each image URL
        urls.forEach((url) => {
          // Extract the relative path from the URL (remove the server domain)
          const relativePath = url.replace(`${envs.SERVER_DOMAIN}/uploads/`, '')
          const filePath = path.join(UPLOAD_IMAGE_FOLDER_PATH, relativePath)

          // Security check: Ensure the file path is within the upload directory
          if (!filePath.startsWith(UPLOAD_IMAGE_FOLDER_PATH)) {
            throw new BadRequestError('Invalid file path')
          }

          // Check if the file exists and delete it
          if (fs.existsSync(filePath) && url) {
            fs.unlinkSync(filePath) // Synchronously delete the file
            logger.info(`Deleted image: ${filePath}`)
          } else {
            console.error(`Image not found: ${filePath}`)
            console.error('Không tìm thấy ảnh trước cũ ?')
          }
        })

        resolve(true)
      } catch (error) {
        reject(new BadRequestError((error as any)?.message || 'Error removing images'))
      }
    })
  }
}

export default new UploadsService()
