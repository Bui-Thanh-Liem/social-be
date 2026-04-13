import { IBase } from '~/shared/interfaces/common/base.interface'
import { IMedia } from '../common/media.interface'
import { EReelStatus, EReelType } from '~/shared/enums/public/reels.enum'
import { ObjectId } from 'mongodb'

export interface IReel extends IBase {
  video: IMedia
  content?: string
  hashtags?: ObjectId[]
  mentions?: ObjectId[]
  isPinAvatar?: boolean // có ghim avatar lên video không
  user: ObjectId
  type: EReelType
  status: EReelStatus
}
