export const CONSTANT_QUEUE = {
  MAIL: 'email',
  INVITE: 'invite',
  CLEANUP: 'cleanup',
  COMPRESSION: 'compression',
  NOTIFICATION: 'notification'
} as const

export const CONSTANT_JOB = {
  INVITE: 'invite',
  SEND_NOTI: 'send-noti',
  VERIFY_MAIL: 'verify-email',
  FORGOT_PASSWORD: 'forgot-password',
  COMPRESSION_HLS: 'compression-hls',
  DELETE_MESSAGES: 'delete-messages',
  DELETE_CHILDREN_TWEET: 'delete-children-tweet'
} as const
