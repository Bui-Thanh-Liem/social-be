import { ObjectId } from 'mongodb'
import { IBase } from './base.interface'

export interface ISearchSuggest extends IBase {
  text?: string
  hashtag?: ObjectId
  searchCount: number
}
