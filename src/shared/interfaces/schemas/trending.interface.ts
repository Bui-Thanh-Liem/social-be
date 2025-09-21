import { ObjectId } from 'mongodb'
import { IBase } from './base.interface'

export interface ITrending extends IBase {
  keyword?: string
  slug?: string
  hashtag?: ObjectId
  count: number
}
