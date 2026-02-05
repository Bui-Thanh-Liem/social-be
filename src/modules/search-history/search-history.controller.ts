import { Request, Response } from 'express'
import { CreatedResponse, OkResponse } from '~/core/success.response'
import { ParamIdDto } from '~/shared/dtos/req/common/param-id.dto'
import { CreateSearchHistoryDto } from '~/shared/dtos/req/search-history.dto'
import { IUser } from '~/shared/interfaces/schemas/user.interface'
import SearchHistoryService from './search-history.service'

class SearchHistoryController {
  async create(req: Request, res: Response) {
    const user_active = req.user as IUser
    const payload = req.body as CreateSearchHistoryDto
    const result = await SearchHistoryService.create({ payload, user_active })
    res.json(new CreatedResponse('Tạo lịch sử tìm kiếm thành công.', result))
  }

  async getMulti(req: Request, res: Response) {
    const user_active = req.user as IUser
    const result = await SearchHistoryService.getMulti({ queries: req.query, user_active })
    res.json(new CreatedResponse('Lấy tất cả lịch sử tìm kiếm thành công.', result))
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params as ParamIdDto
    const result = await SearchHistoryService.delete(id)
    res.json(new OkResponse(`Xóa lịch sử tìm kiếm thành công`, result))
  }
}

export default new SearchHistoryController()
