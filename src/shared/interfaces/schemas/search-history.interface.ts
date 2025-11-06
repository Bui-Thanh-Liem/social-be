import { ObjectId } from 'mongodb'
import { IBase } from './base.interface'

export interface ISearchHistory extends IBase {
  owner: ObjectId

  // Dữ liệu đã search
  text?: string
  trending?: ObjectId
  user?: ObjectId
}
