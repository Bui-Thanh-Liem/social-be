import { Collection, Db, ObjectId } from 'mongodb'
import { IAccessRecent } from '~/shared/interfaces/public/access-recent.interface'
import { BaseSchema } from '~/shared/schemas/base.schema'

export const COLLECTION_ACCESS_RECENT_NAME = 'access-recent'
export class AccessRecentSchema extends BaseSchema implements IAccessRecent {
  ref_id: ObjectId
  user_id: ObjectId
  ref_slug?: string | undefined
  type: 'tweet' | 'community' | 'user'

  constructor(accessRecent: Pick<IAccessRecent, 'ref_id' | 'user_id' | 'type' | 'ref_slug'>) {
    super()
    this.type = accessRecent.type
    this.ref_id = accessRecent.ref_id
    this.user_id = accessRecent.user_id
    this.ref_slug = accessRecent.ref_slug
  }
}

export let AccessRecentCollection: Collection<AccessRecentSchema>

export function initAccessRecentCollection(db: Db) {
  AccessRecentCollection = db.collection<AccessRecentSchema>(COLLECTION_ACCESS_RECENT_NAME)
}
