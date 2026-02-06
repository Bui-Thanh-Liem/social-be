import { Request, Response } from 'express'
import { CreatedResponse, OkResponse } from '~/core/success.response'
import BadWordsService from './bad-words.service'

export class BadWordsController {
  async create(req: Request, res: Response) {
    const newBadWord = await BadWordsService.create({ body: req.body })
    res.json(new CreatedResponse('Tạo từ ngữ cấm thành công', newBadWord))
  }

  async update(req: Request, res: Response) {
    const updatedBadWord = await BadWordsService.update({
      bad_word_id: req.params.bad_word_id,
      body: req.body
    })
    res.json(new OkResponse(`Cập nhật từ ngữ cấm thành công`, updatedBadWord))
  }

  async delete(req: Request, res: Response) {
    const deletedBadWord = await BadWordsService.delete({
      bad_word_id: req.params.bad_word_id
    })
    res.json(new OkResponse(`Xóa từ ngữ cấm thành công`, deletedBadWord))
  }

  async getMulti(req: Request, res: Response) {
    const badWords = await BadWordsService.getMulti({ query: req.query })
    res.json(new OkResponse('Lấy danh sách từ ngữ cấm thành công', badWords))
  }
}

export default new BadWordsController()
