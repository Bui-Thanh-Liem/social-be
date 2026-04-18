import { ObjectId } from 'mongodb'

export function convertObjectId(id: string | ObjectId): ObjectId {
  return typeof id === 'string' ? new ObjectId(id) : id
}
