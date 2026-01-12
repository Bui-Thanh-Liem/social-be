import { Collection, Db, ObjectId } from 'mongodb'
import { BaseSchema } from './Base.schema'
import { IMedia } from '~/shared/interfaces/schemas/media.interface'
import { EMediaStatus } from '~/shared/enums/status.enum'

export class MediaSchema extends BaseSchema implements IMedia {
  size: number
  type: string
  s3_key: string
  file_name: string
  status: EMediaStatus
  user_id?: ObjectId | undefined

  constructor(media: Partial<IMedia>) {
    super()
    this.size = media.size || 0
    this.type = media.type || ''
    this.s3_key = media.s3_key || ''
    this.file_name = media.file_name || ''
    this.user_id = media.user_id || undefined
    this.status = media.status || EMediaStatus.Pending
  }
}

export let MediaCollection: Collection<MediaSchema>

export function initMediaCollection(db: Db) {
  MediaCollection = db.collection<MediaSchema>('media')
}
