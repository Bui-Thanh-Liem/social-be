import { Request, Response } from 'express'
import UploadsService from '~/services/Uploads.service'
import { OkResponse } from '~/core/success.response'
import { RemoteImagesDto } from '~/shared/dtos/req/upload.dto'

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

  async removeImages(req: Request, res: Response) {
    const { urls } = req.body as RemoteImagesDto

    const result = await UploadsService.removeImages(urls)
    res.status(200).json(new OkResponse('Thành công', result))
  }

  async deleteFromCloudinary(req: Request, res: Response) {
    const { urls } = req.body as RemoteImagesDto

    const result = await UploadsService.deleteFromCloudinary(urls)
    res.status(200).json(new OkResponse('Thành công', result))
  }
}

export default new UploadsController()
