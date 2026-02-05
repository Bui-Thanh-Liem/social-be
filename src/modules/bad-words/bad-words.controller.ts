import { Request, Response } from 'express'
import { CreatedResponse } from '~/core/success.response'
import BadWordsService from './bad-words.service'

export class BadWordsController {
  async create(req: Request, res: Response) {
    const newBadWord = await BadWordsService.create({ body: req.body })
    res.json(new CreatedResponse(``, newBadWord))
  }
}

export default new BadWordsController()
