import { Collection, Db, ObjectId } from 'mongodb'
import { ESourceViolation } from '~/shared/enums/common.enum'
import { BaseSchema } from '~/shared/schemas/base.schema'
import { IUserViolation } from './user-violations.interface'

export class UserViolationSchema extends BaseSchema implements IUserViolation {
  user_id: ObjectId
  bad_word_ids: ObjectId[]
  final_content: string
  source: ESourceViolation
  source_id: ObjectId

  constructor(violation: Pick<IUserViolation, 'user_id' | 'bad_word_ids' | 'final_content' | 'source' | 'source_id'>) {
    super()
    this.user_id = violation.user_id
    this.bad_word_ids = violation.bad_word_ids || []
    this.final_content = violation.final_content || ''
    this.source = violation.source
    this.source_id = violation.source_id
  }
}

export let UserViolationsCollection: Collection<UserViolationSchema>

export function initUserViolationsCollection(db: Db) {
  UserViolationsCollection = db.collection<UserViolationSchema>('user-violations')
}
