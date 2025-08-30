import { NextFunction, Request, Response } from 'express'
import ConversationsService from '~/services/Conversations.service'
import { OkResponse } from '~/shared/classes/response.class'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class ConversationsController {
  async create(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await ConversationsService.create({ user_id, payload: req.body })
    res.json(new OkResponse(`Create conversation Success`, result))
  }
}

export default new ConversationsController()
