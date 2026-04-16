import { IBase } from '../common/base.interface'

export interface ILog extends IBase {
  action: string
  admin_id: string
  ip_address: string
  user_agent: string
}
