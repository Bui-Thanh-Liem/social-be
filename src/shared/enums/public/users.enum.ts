export enum EUserStatus {
  Block = 'Đã khoá',
  Hidden = 'Đã ẩn', // Người dùng vẫn tồn tại nhưng không hiển thị trên hệ thống
  Active = 'Đang sử dụng'
}

export enum EUserVerifyStatus {
  Unverified,
  Verified,
  Banned
}

export enum EUserType {
  Normal = 'Bình thường',
  Pro = 'Chuyên nghiệp',
  Kol = 'KOL'
}
