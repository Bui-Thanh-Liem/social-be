import { ObjectId } from 'mongodb'
import { IBase } from '~/shared/interfaces/schemas/base.interface'

export interface ITrending extends IBase {
  topic?: string
  slug?: string
  hashtag?: ObjectId
  count: number
}
