import { Request, Response } from 'express'
import { OkResponse } from '~/core/success.response'
import { parseCloudinaryUrl } from '~/libs/cloudinary.lib'
import UploadsService from '~/services/Uploads.service'
import { IMedia } from '~/shared/interfaces/common/media.interface'

class UploadsController {
  async uploadImages(req: Request, res: Response) {
    const result = await UploadsService.uploadImages(req)
    res.status(200).json(new OkResponse('Thành công', result))
  }

  async uploadVideos(req: Request, res: Response) {
    const result = await UploadsService.uploadVideos(req)
    res.status(200).json(new OkResponse('Thành công', result))
  }

  async uploadToCloudinary(req: Request, res: Response) {
    const result = await UploadsService.uploadToCloudinary(req)
    res.status(200).json(new OkResponse('Thành công', result))
  }

  async signedUrls(req: Request, res: Response) {
    const result = await UploadsService.signedUrls(req.body)
    res.status(200).json(new OkResponse('Thành công', result))
  }

  async removeImages(req: Request, res: Response) {
    const media = req.body as IMedia[]

    const urls = media.map((m) => m.url).filter((url) => !!url)

    const result = await UploadsService.removeImages(urls)
    res.status(200).json(new OkResponse('Thành công', result))
  }

  async deleteFromCloudinary(req: Request, res: Response) {
    const { urls } = req.body as { urls: string[] }

    const media: IMedia[] = urls
      .map((url) => {
        return parseCloudinaryUrl(url)
      })
      .filter((m): m is IMedia => m !== null)

    const result = await UploadsService.deleteFromCloudinary(media)
    res.status(200).json(new OkResponse('Thành công', result))
  }
}

export default new UploadsController()
