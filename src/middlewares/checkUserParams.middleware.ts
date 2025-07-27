import { NextFunction, Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { UserCollection } from '~/models/schemas/User.schema'
import { NotFoundError } from '~/shared/classes/error.class'

export async function checkUserParams(req: Request, res: Response, next: NextFunction) {
  try {
    const { user_id } = req.params as { user_id: string }

    if (!user_id) {
      throw new NotFoundError('User_id is required')
    }

    const tweet = await UserCollection.findOne({ _id: new ObjectId(user_id) }, { projection: { _id: 1 } })
    if (!tweet) {
      throw new NotFoundError('User không tồn tại')
    }

    next()
  } catch (error) {
    next(error)
  }
}
