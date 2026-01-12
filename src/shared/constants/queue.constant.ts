export const CONSTANT_QUEUE = {
  MAIL: 'email',
  SYNC: 'sync',
  INVITE: 'invite',
  CLEANUP: 'cleanup',
  NOTIFICATION: 'notification'
} as const

export const CONSTANT_JOB = {
  INVITE: 'invite',
  SEND_NOTI: 'send-noti',
  VERIFY_MAIL: 'verify-email',
  SYNC_LIKE: 'sync-like',
  SEND_NOTI_LIKE: 'send-noti-like',
  FORGOT_PASSWORD: 'forgot-password',
  DELETE_MESSAGES: 'delete-messages',
  SEND_NOTI_COMMENT: 'send-noti-comment',
  DELETE_CHILDREN_TWEET: 'delete-children-tweet'
} as const
