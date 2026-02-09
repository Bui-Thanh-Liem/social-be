import { ObjectId } from 'mongodb'
import { ESourceViolation } from '~/shared/enums/common.enum'
import { IBase } from '~/shared/interfaces/schemas/base.interface'

export interface IUserViolation extends IBase {
  user_id: ObjectId

  bad_word_ids: ObjectId[] // chỉ các từ bị dính trong LẦN NÀY
  final_content: string

  source: ESourceViolation
  source_id: ObjectId
}
