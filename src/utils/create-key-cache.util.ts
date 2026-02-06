export function createKeyVerifyEmail(email: string) {
  return `{verify}:${email}`
}

export function createKeyAllConversationIds(user_id: string) {
  return `{convs_ids}:${user_id}`
}

export function createKeyTweetDetails(tweet_id: string) {
  return `{tweet}:details:${tweet_id}`
}

export function createKeyTweetDetailsLock(tweet_id: string) {
  return `{tweet}:details:lock:${tweet_id}`
}

export function createKeyTweetStandingThisWeekLock() {
  return `{tweet}:standing_this_week:lock`
}

export function createKeyTweetTodayLock() {
  return `{tweet}:today_tweet:lock`
}

export function createKeyUserActive(user_id: string) {
  return `{user}:active:${user_id}`
}

export function createKeyAdminActive(admin_id: string) {
  return `{admin}:active:${admin_id}`
}

export const createKeyUserOnline = (): string => '{user}:online'

export const createKeyTweetLikeQueue = (): string => '{tweet}:like_queue' // list key

export function createKeyTweetLikesSync(tweet_id: string) {
  return `{tweet}:${tweet_id}:likes:sync`
}

export function createKeyConvIdsByUserId(user_id: string) {
  return `{conv}:${user_id}`
}

export const createKeyUserLastSeen = (): string => '{user}:last_seen'

export const createKeyOutStandingThisWeek = (): string => '{tweet}:outstanding_this_week'
export const createKeyTodayTweet = (): string => '{tweet}:today_tweet'
export const createKeyBadWords = (): string => '{bad_words}:list'
