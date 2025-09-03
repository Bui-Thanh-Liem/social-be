import { NextFunction, Request, Response } from 'express'
import UsersService from '~/services/Users.service'
import { CreateConversationDto } from '~/shared/dtos/req/conversation.dto'

export async function checkExistParticipants(req: Request, res: Response, next: NextFunction) {
  try {
    const { participants } = req.body as CreateConversationDto

    await UsersService.checkExist(participants)

    next()
  } catch (error) {
    next(error)
  }
}
