import { Collection, Db, ObjectId } from 'mongodb'
import { EReelType, EReelStatus } from '~/enums/public/reel.enum'
import { IMedia } from '~/interfaces/common/media.interface'
import { IReel } from '~/interfaces/public/reel.interface'
import { BaseSchema } from '~/shared/schemas/base.schema'

export const COLLECTION_REEL_NAME = 'reels'
export class ReelsSchema extends BaseSchema implements IReel {
  video: IMedia
  content?: string | undefined
  hashtags?: ObjectId[] | undefined
  mentions?: ObjectId[] | undefined
  isPinAvatar?: boolean | undefined
  user: ObjectId
  type: EReelType
  status: EReelStatus

  constructor(reel: Partial<IReel>) {
    super()
    this.video = reel.video || ({ s3_key: '', url: '' } as IMedia)
    this.content = reel.content || undefined
    this.hashtags = reel.hashtags || undefined
    this.mentions = reel.mentions || undefined
    this.isPinAvatar = reel.isPinAvatar || undefined
    this.user = reel.user || new ObjectId()
    this.type = reel.type || EReelType.Reel
    this.status = reel.status || EReelStatus.Ready
  }
}

export let ReelsCollection: Collection<ReelsSchema>

export function initReelsCollection(db: Db) {
  ReelsCollection = db.collection<ReelsSchema>(COLLECTION_REEL_NAME)
}
