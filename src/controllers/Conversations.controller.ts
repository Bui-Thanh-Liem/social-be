import { NextFunction, Request, Response } from 'express'
import ConversationsService from '~/services/Conversations.service'
import { OkResponse } from '~/shared/classes/response.class'
import { DeleteConversationDto, PinConversationDto, ReadConversationDto } from '~/shared/dtos/req/conversation.dto'
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

  async read(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { conv_id } = req.params as ReadConversationDto
    const result = await ConversationsService.read({ user_id, conv_id })
    res.json(new OkResponse(`Đọc cuộc trò chuyện thành công`, result))
  }

  async togglePinConv(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { conv_id } = req.params as PinConversationDto
    const mess = await ConversationsService.togglePinConv({ user_id, conv_id })
    res.json(new OkResponse(`${mess} cuộc trò chuyện thành công`, true))
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { conv_id } = req.params as DeleteConversationDto
    const result = await ConversationsService.delete({ user_id, conv_id })
    res.json(new OkResponse(`Xoá cuộc trò chuyện thành công`, result))
  }
}

export default new ConversationsController()
