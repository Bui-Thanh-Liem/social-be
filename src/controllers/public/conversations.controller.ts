import { Request, Response } from 'express'
import { OkResponse } from '~/core/success.response'
import {
  AddParticipantsBodyDto,
  PromoteMentorBodyDto,
  RemoveParticipantsBodyDto
} from '~/dtos/public/conversations.dto'
import conversationsService from '~/services/public/conversations.service'
import { IJwtPayload } from '~/shared/interfaces/jwt.interface'

class ConversationsController {
  async create(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await conversationsService.create({ user_id: user_id!, payload: req.body })
    res.json(new OkResponse(`Tạo cuộc trò chuyện thành công.`, result))
  }

  async addParticipants(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { participants } = req.body as AddParticipantsBodyDto
    const result = await conversationsService.addParticipants({
      id: req.params.id,
      user_id: user_id!,
      participants
    })
    res.json(new OkResponse(`Đã thêm thành viên vào cuộc trò chuyện.`, result))
  }

  async removeParticipants(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { participants } = req.body as RemoveParticipantsBodyDto
    const result = await conversationsService.removeParticipants({
      user_id: user_id!,
      id: req.params.id,
      participant: participants[0]
    })
    res.json(new OkResponse(`${result} cuộc trò chuyện thành công.`, result))
  }

  async promoteMentor(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { participants } = req.body as PromoteMentorBodyDto
    const result = await conversationsService.promoteMentor({
      user_id: user_id!,
      id: req.params.id,
      participant: participants[0]
    })
    res.json(new OkResponse(`Bạn đã cho một thành viên lên nhóm trưởng thành công.`, result))
  }

  async getMulti(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await conversationsService.getMulti({ user_id: user_id!, query: req.query })
    res.json(new OkResponse(`Lấy nhiều cuộc trò chuyện thành công.`, result))
  }

  async read(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await conversationsService.read({ user_id: user_id!, id: req.params.id })
    res.json(new OkResponse(`Đọc cuộc trò chuyện thành công.`, result))
  }

  async togglePinConv(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const mess = await conversationsService.togglePinConversion({ user_id: user_id!, id: req.params.id })
    res.json(new OkResponse(`${mess} cuộc trò chuyện thành công.`, true))
  }

  async delete(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const result = await conversationsService.delete({ user_id: user_id!, id: req.params.id })
    res.json(new OkResponse(`Xoá cuộc trò chuyện thành công.`, result))
  }
}

export default new ConversationsController()
