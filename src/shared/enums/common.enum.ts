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
  Tweet = 'Nội dung bài viết',
  Auth = 'Thông tin cá nhân',
  Community = 'Thông tin cộng đồng',
  Hashtag = 'Hashtag',
  SearchHistory = 'Lịch sử tìm kiếm',
  Message = 'Tin nhắn'
}
