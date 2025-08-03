export enum ETweetType {
  Tweet,
  Retweet,
  Comment,
  QuoteTweet // đăng lại và thêm được content của mình
}

export enum EMediaType {
  Image,
  Video
}

export enum ETokenType {
  accessToken,
  refreshToken,
  forgotPasswordToken,
  verifyToken
}

export enum EFeedType {
  All = 'all', // New feeds tổng (everyone + following)
  Everyone = 'everyone', // Chỉ người mình everyone
  Following = 'following' // Chỉ người mình follow
}
