import { Request } from 'express'
import fs from 'fs'
import path from 'path'
import { envs } from '~/configs/env.config'
import { BadRequestError } from '~/core/error.reponse'
import { UPLOAD_IMAGE_FOLDER_PATH } from '~/shared/constants'
import { ResUpload } from '~/shared/dtos/res/upload.dto'
import { EMediaType } from '~/shared/enums/type.enum'
import { logger } from '~/utils/logger.util'
import { uploadImages, uploadVideos } from '~/utils/upload.util'

class UploadsService {
  async uploadImages(req: Request): Promise<ResUpload[]> {
    const urls = await uploadImages(req)
    return urls.map((url) => ({ type: EMediaType.Image, url }))
  }

  async uploadVideos(req: Request): Promise<ResUpload[]> {
    const urls = await uploadVideos(req)
    return urls.map((url) => ({ type: EMediaType.Video, url }))
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
