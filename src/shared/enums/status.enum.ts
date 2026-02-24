export enum EAuthVerifyStatus {
  Unverified,
  Verified,
  Banned
}

export enum EMediaStatus {
  Pending,
  Reject,
  Active
}

export enum ETweetStatus {
  Pending = 'Chờ duyệt',
  Reject = 'Từ chối',
  Ready = 'Sẵn sàng'
}

export enum EInvitationStatus {
  Pending,
  Accepted
}

export enum EUserStatus {
  Block = 'Đã khoá',
  Active = 'Đang sử dụng'
}
