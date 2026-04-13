import { Server, Socket } from 'socket.io'
import CommunityGateway from '../gateways/Community.gateway'
import { CONSTANT_EVENT_NAMES } from '~/shared/constants/socket.constant'

export async function communityHandler(io: Server, socket: Socket) {
  // Join vào community
  socket.on(CONSTANT_EVENT_NAMES.JOIN_COMMUNITY, async (id: string) => {
    console.log('Join community:::', id)
    socket.join(id)
    await CommunityGateway.sendCountTweetApprove(id)
  })

  // Leave ra community
  socket.on(CONSTANT_EVENT_NAMES.LEAVE_COMMUNITY, (id: string) => {
    console.log('Leave community:::', id)
    socket.leave(id)
  })
}
