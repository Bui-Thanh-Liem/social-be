import { ObjectId } from 'mongodb'
import { IBase } from '~/shared/interfaces/base.interface'
import { ESourceViolation } from '../../enums/public/user-violations.enum'

export interface IUserViolation extends IBase {
  user_id: ObjectId

  bad_word_ids: ObjectId[] // chỉ các từ bị dính trong LẦN NÀY
  final_content: string

  source: ESourceViolation
  source_id: ObjectId
}
