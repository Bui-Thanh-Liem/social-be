import { Request, Response } from 'express'
import { OkResponse } from '~/core/success.response'
import UploadsServices from '~/services/Uploads.service'
import { PresignedUrlDto, UploadConfirmDto } from '~/shared/dtos/req/upload.dto'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class UploadsControllers {
  async presignedURL(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await UploadsServices.presignedURL(req.body as PresignedUrlDto, user_id)
    res.json(new OkResponse('Lấy presigned URL thành công', result))
  }

  async confirmUpload(req: Request, res: Response) {
    const result = await UploadsServices.confirmUpload(req.body as UploadConfirmDto)
    res.json(new OkResponse('Xác nhận tải ảnh/ video lên thành công', result))
  }

  async delete(req: Request, res: Response) {
    const result = await UploadsServices.delete(req.body)
    res.json(new OkResponse('Xoá ảnh/ video thành công', result))
  }
}

export default new UploadsControllers()
