import { EActionBadWord, EPriorityBadWord } from '~/shared/enums/public/bad-words.enum'
import { IBase } from '~/shared/interfaces/common/base.interface'

export interface IBadWord extends IBase {
  words: string
  priority: EPriorityBadWord
  replace_with: string
  usage_count: number
  action: EActionBadWord
}

export interface IBadWordsCached {
  _id: string
  original: string
  normalized: string
  replaceWith: string
}
