import { Request, Response } from 'express'
import MessagesService from '~/services/Messages.service'
import { OkResponse } from '~/core/success.response'
import { GetMultiMessageByConversationDto } from '~/shared/dtos/req/message.dto'

class MessagesController {
  async getMultiByConversation(req: Request, res: Response) {
    const { conversation_id } = req.params as GetMultiMessageByConversationDto
    const result = await MessagesService.getMultiByConversation({ conversation_id, query: req.query })
    res.json(new OkResponse(`Get multi by conversation Success`, result))
  }
}

export default new MessagesController()
