import { EPriorityBadWord } from '~/shared/enums/common.enum'
import { IBase } from '../../shared/interfaces/schemas/base.interface'

export interface IBadWord extends IBase {
  words: string
  priority: EPriorityBadWord
  replace_with: string
  usage_count: number
}
