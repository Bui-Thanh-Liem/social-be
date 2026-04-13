import 'express'
import 'socket.io'
import { IJwtPayload } from './shared/interfaces/common/jwt.interface'
import { IQuery } from './shared/interfaces/common/query.interface'
import { ITweet } from './shared/interfaces/schemas/tweet.interface'
import { IUser } from './shared/interfaces/schemas/user.interface'
import { IAdmin } from './interfaces/private/admin.interface'

declare module 'express' {
  interface Request {
    user?: IUser
    tweet?: ITweet
    admin?: IAdmin
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
