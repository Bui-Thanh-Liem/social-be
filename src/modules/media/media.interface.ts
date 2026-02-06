import { ObjectId } from 'mongodb'
import { EMediaStatus } from '~/shared/enums/status.enum'

export interface IMedia {
  file_type: string
  file_size: number
  file_name: string

  url?: string | undefined
  s3_key: string

  user_id?: ObjectId
  status: EMediaStatus
}

export type IMediaBare = Pick<IMedia, 's3_key' | 'url'>
