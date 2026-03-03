export interface IGoogleToken {
  access_token: string
  expires_id: number
  refresh_token?: string
  scope: string
  token_type: string
  id_token: string
}

export interface IGoogleUserProfile {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
}
