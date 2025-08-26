import { Request } from 'express'
import fs from 'fs'
import path from 'path'
import { envs } from '~/configs/env.config'
import { BadRequestError } from '~/shared/classes/error.class'
import { UPLOAD_IMAGE_FOLDER_PATH } from '~/shared/constants'
import { logger } from '~/utils/logger.util'
import { uploadImages, uploadVideos } from '~/utils/upload.util'

class UploadsService {
  async remoteImages(urls: string[]) {
    return new Promise((resolve, reject) => {
      try {
        // Validate that the image URLs are provided
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
          return reject(new BadRequestError('No image URLs provided'))
        }

        // Process each image URL
        urls.forEach((url) => {
          // Extract the relative path from the URL (remove the server domain)
          const relativePath = url.replace(`${envs.SERVER_DOMAIN}/`, '')
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
            console.warn(`Image not found: ${filePath}`)
          }
        })

        resolve(true)
      } catch (error) {
        reject(new BadRequestError((error as any)?.message || 'Error removing images'))
      }
    })
  }

  async uploadImages(req: Request) {
    const files = await uploadImages(req)
    return files
  }

  async uploadVideos(req: Request) {
    logger.info('UploadsService:::')

    const videos = await uploadVideos(req)
    logger.info('videos:::', videos)

    return videos
  }
}

export default new UploadsService()
