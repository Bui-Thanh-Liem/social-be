import { NextFunction, Request, Response } from 'express'
import UsersService from '~/services/Users.service'

export async function checkExistParticipants(req: Request, res: Response, next: NextFunction) {
  try {
    const { participants } = req.body as { participants: string[] }

    await UsersService.checkExist(participants)

    next()
  } catch (error) {
    next(error)
  }
}
