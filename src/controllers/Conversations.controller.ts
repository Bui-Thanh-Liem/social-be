import { NextFunction, Request, Response } from 'express'
import ConversationsService from '~/services/Conversations.service'
import { OkResponse } from '~/shared/classes/response.class'
import { ReadConversationDto } from '~/shared/dtos/req/conversation.dto'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class ConversationsController {
  async create(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await ConversationsService.create({ user_id, payload: req.body })
    res.json(new OkResponse(`Tạo cuộc trò chuyện thành công`, result))
  }

  async getMulti(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await ConversationsService.getMulti({ user_id, query: req.query })
    res.json(new OkResponse(`Lấy nhiều cuộc trò chuyện thành công`, result))
  }

  async readConversation(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { conversation_id } = req.params as ReadConversationDto
    const result = await ConversationsService.readConversation({ user_id, conversation_id })
    res.json(new OkResponse(`Lấy nhiều cuộc trò chuyện thành công`, result))
  }
}

export default new ConversationsController()
