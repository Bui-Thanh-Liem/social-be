import { Request, Response } from 'express'
import { OkResponse } from '~/core/success.response'
import UploadsServices from '~/services/Uploads.service'
import { PresignedURLDto, UploadConfirmDto } from '~/shared/dtos/req/upload.dto'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class UploadsControllers {
  async presignedURL(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await UploadsServices.presignedURL(req.body as PresignedURLDto, user_id)
    res.json(new OkResponse('Lấy signed URLs thành công', result))
  }

  async confirmUpload(req: Request, res: Response) {
    const result = await UploadsServices.confirmUpload(req.body as UploadConfirmDto)
    res.json(new OkResponse('Upload file thành công', result))
  }

  async delete(req: Request, res: Response) {
    const result = await UploadsServices.delete(req.body)
    res.json(new OkResponse('Xoá file thành công', result))
  }
}

export default new UploadsControllers()
