import { Worker } from 'bullmq'
import { redisConfig } from '~/configs/redis.config'
import CommunityInvitationService from '~/services/Community-invitation.service'
import { CONSTANT_JOB, CONSTANT_QUEUE } from '~/shared/constants'
import { CreateCommunityInvitationDto } from '~/shared/dtos/req/community.dto'
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
    connection: redisConfig
  }
)

inviteWorker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed: ${err.message}`)
})
