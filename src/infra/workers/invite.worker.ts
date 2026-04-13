import { Worker } from 'bullmq'
import { bullRedisOptions } from '~/configs/redis.config'
import { CreateCommunityInvitationDto } from '~/shared/dtos/public/communities.dto'
import CommunityInvitationService from '~/services/public/community-invitations.service'
import { CONSTANT_JOB, CONSTANT_QUEUE } from '~/shared/constants/queue.constant'
import { logger } from '~/utils/logger.util'

export const inviteWorker = new Worker(
  CONSTANT_QUEUE.INVITE,
  async (job) => {
    //
    switch (job.name) {
      case CONSTANT_JOB.INVITE: {
        const payload = job.data as CreateCommunityInvitationDto
        await CommunityInvitationService.create(payload)
        console.log('Invited ::::', payload)
        break
      }
    }
  },
  {
    concurrency: 5,
    connection: bullRedisOptions
  }
)

inviteWorker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed: ${err.message}`)
})
