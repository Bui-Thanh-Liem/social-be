import { NextFunction, Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { NotFoundError } from '~/core/error.response'
import { UsersCollection } from '~/modules/users/user.schema'

export async function checkUserParams(req: Request, res: Response, next: NextFunction) {
  try {
    const { user_id } = req.params as { user_id: string }

    if (!user_id) {
      throw new NotFoundError('Người dùng không tồn tại')
    }

    const user = await UsersCollection.findOne({ _id: new ObjectId(user_id) }, { projection: { _id: 1 } })
    if (!user) {
      throw new NotFoundError('Người dùng không tồn tại')
    }

    req.user_local_one_lifecycle = user
    next()
  } catch (error) {
    next(error)
  }
}
