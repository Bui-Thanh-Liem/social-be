import { ObjectId } from 'mongodb'
import { EMediaStatus } from '~/shared/enums/status.enum'

export interface IMedia {
  size: number
  type: string
  s3_key: string
  file_name: string
  user_id?: ObjectId
  status: EMediaStatus
}
