import 'express'
import { IJwtPayload } from './shared/interfaces/common/jwt.interface'
import { ITweet } from './shared/interfaces/schemas/tweet.interface'
import { IUser } from './shared/interfaces/schemas/user.interface'

declare module 'express' {
  interface Request {
    user?: IUser
    user_local_one_lifecycle?: IUser
    tweet?: Pick<ITweet, '_id' | 'user_id' | 'audience'>
    decoded_authorization?: IJwtPayload
    decoded_refresh_token?: IJwtPayload
  }
}
