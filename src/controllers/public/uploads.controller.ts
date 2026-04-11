import { Request, Response } from 'express'
import { OkResponse } from '~/core/success.response'
import { PresignedUrlDto, UploadConfirmDto } from '~/dtos/public/uploads.dto'
import uploadsService from '~/services/public/uploads.service'
import { IJwtPayload } from '~/shared/interfaces/jwt.interface'

class UploadsControllers {
  async presignedURL(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await uploadsService.presignedURL(req.body as PresignedUrlDto, user_id)
    res.json(new OkResponse('Lấy presigned URL thành công', result))
  }

  async confirmUpload(req: Request, res: Response) {
    const result = await uploadsService.confirmUpload(req.body as UploadConfirmDto)
    res.json(new OkResponse('Xác nhận tải ảnh/ video lên thành công', result))
  }

  async delete(req: Request, res: Response) {
    const result = await uploadsService.delete(req.body)
    res.json(new OkResponse('Xoá ảnh/ video thành công', result))
  }

  // ====== ADMIN ONLY ======

  async remind(req: Request, res: Response) {
    const { admin_id } = req.decoded_authorization as IJwtPayload
    const result = await uploadsService.remind({ admin_id, media_id: req.params.media_id })
    res.json(new OkResponse('Lấy danh sách hình ảnh / video thành công', result))
  }
  async deleteByAdmin(req: Request, res: Response) {
    const { admin_id } = req.decoded_authorization as IJwtPayload
    const result = await uploadsService.deleteByAdmin({ admin_id, body: req.body })
    res.json(new OkResponse('Xoá ảnh/ video thành công', result))
  }
  // ========================
}

export default new UploadsControllers()
