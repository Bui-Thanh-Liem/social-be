export enum EMembershipType {
  Open = 'Mở',
  Invite_only = 'Chỉ được mời'
}

export enum EVisibilityType {
  Public = 'Công cộng',
  Private = 'Riêng tư'
}

export enum EActivityType {
  Join,
  Leave,
  Invite
}

export enum EInvitationStatus {
  Pending,
  Accepted
}
