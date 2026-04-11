import { Request, Response } from 'express'
import { CreatedResponse, OkResponse } from '~/core/success.response'
import badWordsService from '~/services/public/bad-words.service'

class BadWordsController {
  async create(req: Request, res: Response) {
    const newBadWord = await badWordsService.create({ body: req.body })
    res.json(new CreatedResponse('Tạo từ ngữ cấm thành công', newBadWord))
  }

  async update(req: Request, res: Response) {
    const updatedBadWord = await badWordsService.update({
      id: req.params.id,
      body: req.body
    })
    res.json(new OkResponse(`Cập nhật từ ngữ cấm thành công`, updatedBadWord))
  }

  async delete(req: Request, res: Response) {
    const deletedBadWord = await badWordsService.delete({
      id: req.params.id
    })
    res.json(new OkResponse(`Xóa từ ngữ cấm thành công`, deletedBadWord))
  }

  async getMulti(req: Request, res: Response) {
    const badWords = await badWordsService.getMulti({ query: req.queryParsed })
    res.json(new OkResponse('Lấy danh sách từ ngữ cấm thành công', badWords))
  }

  async getMultiMostUsed(req: Request, res: Response) {
    const badWords = await badWordsService.getMultiMostUsed({ query: req.query })
    res.json(new OkResponse('Lấy danh sách từ ngữ cấm sử dụng gần đây thành công', badWords))
  }
}

export default new BadWordsController()
