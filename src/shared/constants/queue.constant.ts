export const CONSTANT_QUEUE = {
  MAIL: '{email}',
  TWEET: '{tweet}',
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
  CHECK_USER_TYPE: 'check-user-type',
  FORGOT_PASSWORD: 'forgot-password',
  DELETE_MESSAGES: 'delete-messages',
  HANDLE_NEWS_FEED: 'handle-news-feed',
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
