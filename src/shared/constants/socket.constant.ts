export const CONSTANT_EVENT_NAMES = {
  // USER
  USER_ONLINE: 'user:online',

  // MESSAGE
  SEND_MESSAGE: 'message:send',
  NEW_MESSAGE: 'message:new',

  // NOTIFICATION
  NEW_NOTIFICATION: 'notification:new',
  UNREAD_COUNT_NOTIFICATION: 'notification:unread:count',
  UNREAD_COUNT_NOTIFICATION_BY_TYPE: 'notification:unread:count:by:type',

  // CONVERSATION
  UNREAD_COUNT_CONVERSATION: 'conversation:unread:count',
  NEW_CONVERSATION: 'conversation:new',
  JOIN_CONVERSATION: 'conversation:join',
  CHANGE_CONVERSATION: 'conversation:change',
  LEAVE_CONVERSATION: 'conversation:leave',

  // COMMENT
  NEW_COMMENT: 'comment:new',
  JOIN_COMMENT: 'comment:join',
  LEAVE_COMMENT: 'comment:leave',

  //
  ERROR: 'error'
} as const
