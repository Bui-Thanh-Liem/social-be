import { IBase } from './base.interface'

export interface ICommunity extends IBase {
  name: string
  cover: string
  bio: string
  pin: boolean
  category: string
  verify: boolean
}
