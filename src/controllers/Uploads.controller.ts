import { NextFunction, Request, Response } from 'express'
import UploadsService from '~/services/Uploads.service'
import { OkResponse } from '~/shared/classes/response.class'
import { RemoteImagesDto } from '~/shared/dtos/req/upload.dto'

class UploadsController {
  async uploadImages(req: Request, res: Response, next: NextFunction) {
    const result = await UploadsService.uploadImages(req)
    res.status(200).json(new OkResponse('Thành công', result))
  }

  async remoteImages(req: Request, res: Response, next: NextFunction) {
    const { urls } = req.body as RemoteImagesDto
    const result = await UploadsService.remoteImages(urls)
    res.status(200).json(new OkResponse('Thành công', result))
  }

  async uploadVideos(req: Request, res: Response, next: NextFunction) {
    const result = await UploadsService.uploadVideos(req)
    res.status(200).json(new OkResponse('Thành công', result))
  }
}

export default new UploadsController()
