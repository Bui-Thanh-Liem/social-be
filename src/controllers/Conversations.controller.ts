import { Request, Response } from 'express'
import ConversationsService from '~/services/Conversations.service'
import { OkResponse } from '~/core/success.reponse'
import {
  AddParticipantsBodyDto,
  AddParticipantsParamDto,
  DeleteConversationDto,
  PinConversationDto,
  PromoteMentorBodyDto,
  PromoteMentorParamDto,
  ReadConversationDto,
  RemoveParticipantsBodyDto,
  RemoveParticipantsParamDto
} from '~/shared/dtos/req/conversation.dto'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'

class ConversationsController {
  async create(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await ConversationsService.create({ user_id, payload: req.body })
    res.json(new OkResponse(`Tạo cuộc trò chuyện thành công.`, result))
  }

  async addParticipants(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { conv_id } = req.params as AddParticipantsParamDto
    const { participants } = req.body as AddParticipantsBodyDto
    const result = await ConversationsService.addParticipants({
      conv_id,
      user_id,
      participants
    })
    res.json(new OkResponse(`Thêm thành viên vào cuộc trò chuyện thành công.`, result))
  }

  async removeParticipants(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { conv_id } = req.params as RemoveParticipantsParamDto
    const { participants } = req.body as RemoveParticipantsBodyDto
    const result = await ConversationsService.removeParticipants({
      conv_id,
      user_id,
      participant: participants[0]
    })
    res.json(new OkResponse(`${result} cuộc trò chuyện thành công.`, result))
  }

  async promoteMentor(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { conv_id } = req.params as PromoteMentorParamDto
    const { participants } = req.body as PromoteMentorBodyDto
    const result = await ConversationsService.promoteMentor({
      conv_id,
      user_id,
      participant: participants[0]
    })
    res.json(new OkResponse(`Bạn đã cho một thành viên lên nhóm trưởng thành công.`, result))
  }

  async getMulti(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await ConversationsService.getMulti({ user_id, query: req.query })
    res.json(new OkResponse(`Lấy nhiều cuộc trò chuyện thành công.`, result))
  }

  async read(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { conv_id } = req.params as ReadConversationDto
    const result = await ConversationsService.read({ user_id, conv_id })
    res.json(new OkResponse(`Đọc cuộc trò chuyện thành công.`, result))
  }

  async togglePinConv(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { conv_id } = req.params as PinConversationDto
    const mess = await ConversationsService.togglePinConv({ user_id, conv_id })
    res.json(new OkResponse(`${mess} cuộc trò chuyện thành công.`, true))
  }

  async delete(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { conv_id } = req.params as DeleteConversationDto
    const result = await ConversationsService.delete({ user_id, conv_id })
    res.json(new OkResponse(`Xoá cuộc trò chuyện thành công.`, result))
  }
}

export default new ConversationsController()
