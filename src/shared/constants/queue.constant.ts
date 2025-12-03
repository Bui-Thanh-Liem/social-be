export const CONSTANT_QUEUE = {
  MAIL: 'email-queue',
  CLEANUP: 'cleanup-queue',
  COMPRESSION: 'compression-queue',
  NOTIFICATION: 'notification-queue',
  INVITE: 'invite-queue'
} as const

export const CONSTANT_JOB = {
  INVITE: 'invite',
  SEND_NOTI: 'send-noti',
  VERIFY_MAIL: 'verify-email',
  FORGOT_PASSWORD: 'forgot-password',
  COMPRESSION_HLS: 'compression-hls',
  DELETE_CHILDREN_TWEET: 'delete-children-tweet',
  DELETE_MESSAGES: 'delete-messages'
} as const
