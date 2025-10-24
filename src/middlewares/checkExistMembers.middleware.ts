import { NextFunction, Request, Response } from 'express'
import UsersService from '~/services/Users.service'

export async function checkExistMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const { member_ids } = req.body as { member_ids: string[] }

    if (member_ids) await UsersService.checkExist(member_ids)

    next()
  } catch (error) {
    next(error)
  }
}
