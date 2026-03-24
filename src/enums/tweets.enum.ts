export enum ETweetAudience {
  Everyone,
  Followers,
  Mentions
}

export enum EFeedType {
  All = 'all', // New feeds tổng (everyone + following)
  Everyone = 'everyone', // Chỉ người mình everyone
  Following = 'following' // Chỉ người mình follow
}

export enum ETweetType {
  Tweet,
  Retweet,
  Comment,
  QuoteTweet // đăng lại và thêm được content của mình
}

export enum EFeedTypeItem {
  Tweet = 'tweet',
  Community = 'Community'
}

export enum ETweetStatus {
  Pending = 'Chờ duyệt',
  Reject = 'Từ chối',
  Ready = 'Sẵn sàng'
}
