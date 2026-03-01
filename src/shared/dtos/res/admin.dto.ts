export type ResLoginAdmin = {
  admin_id: string
  two_factor_enabled: boolean
  two_factor_session_enabled: boolean
}

export type ResVerify2Fa = {
  access_token: string
  refresh_token: string
  two_factor_session_enabled: boolean
}
