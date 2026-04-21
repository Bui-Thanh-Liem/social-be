import { CONSTANT_EVENT_NAMES } from '~/shared/constants/socket.constant'
import { getIO } from '..'

class AuthGateway {
  async logoutUser(userId: string) {
    const io = getIO()
    console.log('AuthGateway - logout:::', userId)

    //
    io.to(userId).emit(CONSTANT_EVENT_NAMES.USER_LOGOUT, { userId })
  }
}

export default new AuthGateway()
