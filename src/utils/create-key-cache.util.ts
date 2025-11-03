export function createKeyVerifyEmail(email: string) {
  return `verify:${email}`
}

export function createKeyAllConversationIds(user_id: string) {
  return `conversations_ids:${user_id}`
}
