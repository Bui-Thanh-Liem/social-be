import { ObjectId } from 'mongodb'
import { IBase } from '~/shared/interfaces/schemas/base.interface'

export interface ISearchHistory extends IBase {
  owner: ObjectId

  // Dữ liệu đã search
  text?: string
  trending?: ObjectId
  user?: ObjectId
  community?: ObjectId
}
