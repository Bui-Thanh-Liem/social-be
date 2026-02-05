import { NextFunction, Request, Response } from 'express'
import UsersService from '~/modules/users/users.service'

export async function checkExistParticipants(req: Request, res: Response, next: NextFunction) {
  try {
    const { participants } = req.body as { participants: string[] }

    await UsersService.checkUsersExist(participants)

    next()
  } catch (error) {
    next(error)
  }
}
