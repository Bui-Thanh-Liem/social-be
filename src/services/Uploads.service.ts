import { Request } from 'express'
import { uploadImages, uploadVideos } from '~/utils/upload.util'

class UploadsService {
  async uploadImages(req: Request) {
    const files = await uploadImages(req)
    return files
  }

  async uploadVideos(req: Request) {
    console.log('UploadsService:::')

    const videos = await uploadVideos(req)
    console.log('videos:::', videos)

    return videos
  }
}

export default new UploadsService()
