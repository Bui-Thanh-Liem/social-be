import { NextFunction, Request, Response } from 'express'
import UsersService from '~/services/public/users.service'

export async function checkExistParticipantsMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const { participants } = req.body as { participants: string[] }

    await UsersService.checkUsersExist(participants)

    next()
  } catch (error) {
    next(error)
  }
}
