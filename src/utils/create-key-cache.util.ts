export function createKeyVerifyEmail(email: string) {
  return `verify:${email}`
}

export function createKeyAllConversationIds(user_id: string) {
  return `convs_ids:${user_id}`
}

export function createKeyTweetDetails(tweet_id: string) {
  return `tweet:details:${tweet_id}`
}

export function createKeyTweetLock(tweet_id: string) {
  return `tweet:lock:${tweet_id}`
}

export function createKeyUserActive(user_id: string) {
  return `user:active:${user_id}`
}

export const createKeyTweetLikesCount = () => 'tweet:likes_count' // hash key

export function createKeyTweetLikes(tweet_id: string) {
  return `tweet:${tweet_id}:likes`
}

export const createKeyUserOnline = (): string => 'user:online'

export const createKeyTweetLikeQueue = (): string => 'tweet:like_queue' // list key

export function createKeyTweetLikesSync(tweet_id: string) {
  return `tweet:${tweet_id}:likes:sync`
}

export const createKeyUserLastSeen = (): string => 'user:user:last_seen'
