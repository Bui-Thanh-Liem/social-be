import { Request, Response } from 'express'
import { IMedia } from '~/shared/interfaces/common/media.interface'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { OkResponse } from '~/core/success.response'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import mediaService from '~/services/private/medias.service'

class MediaController {
  async getMedias(req: Request, res: Response) {
    const { admin_id } = req.decoded_authorization as IJwtPayload
    const result = await mediaService.getMedias({
      admin_id,
      query: req.queryParsed as IQuery<IMedia>
    })
    res.json(new OkResponse('Lấy danh sách hình ảnh / video thành công', result))
  }
}

export default new MediaController()
