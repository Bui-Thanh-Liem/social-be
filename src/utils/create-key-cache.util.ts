export function createKeyVerifyEmail(email: string) {
  return `verify:${email}`
}

export function createKeyAllConversationIds(user_id: string) {
  return `convs_ids:${user_id}`
}

export function createKeyTweetDetails(tweet_id: string) {
  return `tweet:d:${tweet_id}`
}

export function createKeyTweetLock(tweet_id: string) {
  return `tweet:l:${tweet_id}`
}

export function createKeyUserActive(user_id: string) {
  return `user:active:${user_id}`
}
