import 'express'
import 'socket.io'
import { IJwtPayload } from './shared/interfaces/jwt.interface'
import { IQuery } from './shared/interfaces/query.interface'
import { ITweet } from './shared/interfaces/schemas/tweet.interface'
import { IUser } from './shared/interfaces/schemas/user.interface'

declare module 'express' {
  interface Request {
    user?: IUser
    tweet?: ITweet
    queryParsed?: IQuery
    user_local_one_lifecycle?: IUser
    decoded_authorization?: IJwtPayload
    decoded_refresh_token?: IJwtPayload
  }
}

declare module 'socket.io' {
  interface Socket {
    decoded_authorization?: IJwtPayload
  }
}
