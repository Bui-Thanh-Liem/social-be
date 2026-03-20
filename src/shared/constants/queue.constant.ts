export const CONSTANT_QUEUE = {
  MAIL: '{email}',
  INVITE: '{invite}',
  SYSTEM: '{system}',
  NOTIFICATION: '{notification}'
} as const

export const CONSTANT_JOB = {
  INVITE: 'invite',
  SYNC_LIKE: 'sync-like',
  SEND_NOTI: 'send-noti',
  VERIFY_MAIL: 'verify-email',
  SEND_NOTI_LIKE: 'send-noti-like',
  FORGOT_PASSWORD: 'forgot-password',
  DELETE_MESSAGES: 'delete-messages',
  SEND_NOTI_COMMENT: 'send-noti-comment',
  DELETE_CHILDREN_TWEET: 'delete-children-tweet',

  //
  DELETE_TWEET_REPORT: 'delete-tweet-report',

  //
  CLEANUP_OLD_TRENDING: 'cleanup-old-trending',
  CLEANUP_WEAK_TRENDING: 'cleanup-weak-trending',
  CLEANUP_OLD_NOTIFICATIONS: 'cleanup-old-notifications',

  //
  MOCK_DATA: 'mock-data'
} as const
