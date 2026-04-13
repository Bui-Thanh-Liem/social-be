import { ObjectId } from 'mongodb'

export interface IBase {
  _id?: ObjectId
  created_at?: Date
  updated_at?: Date
}
