export enum ETweetAudience {
  Everyone,
  Followers,
  Mentions
}

export enum EPriorityBadWord {
  High = 'Cao',
  Medium = 'Trung bình',
  Low = 'Thấp'
}

export enum EActionBadWord {
  Warn = 'Cảnh báo',
  Block = 'Chặn'
}

export enum ESourceViolation {
  Tweet,
  Auth,
  Community,
  Hashtag,
  SearchHistory,
  Message
}
