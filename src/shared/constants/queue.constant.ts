export const CONSTANT_QUEUE = {
  SEND_MAIL: 'send-email',
  COMPRESSION: 'compression',
  SEND_NOTI: 'send-noti',
  DELETE_TWEET: 'delete-tweet',
  INVITE: 'invite'
} as const

export const CONSTANT_JOB = {
  VERIFY_MAIL: 'verify-email',
  FORGOT_PASSWORD: 'forgot-password',
  COMPRESSION_HLS: 'compression-hls',
  UNREAD_NOTI: 'unread-noti',
  DELETE_CHILDREN_TWEET: 'delete-children-tweet',
  INVITE_COMMUNITY: 'invite-community'
} as const
