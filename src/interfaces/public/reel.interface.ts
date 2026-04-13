import { IBase } from '~/shared/interfaces/base.interface'
import { IMedia } from '../common/media.interface'
import { EReelStatus, EReelType } from '~/enums/public/reel.enum'
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
