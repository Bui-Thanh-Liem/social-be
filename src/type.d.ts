import 'express'
import 'socket.io'
import { IJwtPayload } from './shared/interfaces/common/jwt.interface'
import { ITweet } from './shared/interfaces/schemas/tweet.interface'
import { IUser } from './shared/interfaces/schemas/user.interface'
import { IAdmin } from './modules/admin/admin.interface'

declare module 'express' {
  interface Request {
    user?: IUser
    admin?: IAdmin
    user_local_one_lifecycle?: IUser
    tweet?: ITweet
    decoded_authorization?: IJwtPayload
    decoded_refresh_token?: IJwtPayload
  }
}

declare module 'socket.io' {
  interface Socket {
    decoded_authorization?: IJwtPayload
  }
}
