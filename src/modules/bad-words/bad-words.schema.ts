import { Collection, Db } from 'mongodb'
import { IBadWord } from '~/modules/bad-words/bad-words.interface'
import { BaseSchema } from '~/shared/schemas/base.schema'
import { EActionBadWord, EPriorityBadWord } from './bad-words.enum'

export const COLLECTION_BAD_WORDS_NAME = 'bad-words'
export class BadWordSchema extends BaseSchema implements IBadWord {
  words: string
  usage_count: number
  replace_with: string
  priority: EPriorityBadWord
  action: EActionBadWord

  constructor(badWord: Pick<IBadWord, 'words' | 'priority' | 'replace_with' | 'action'>) {
    super()
    this.usage_count = 0
    this.words = badWord.words || ''
    this.replace_with = badWord.replace_with || ''
    this.action = badWord.action || EActionBadWord.Warn
    this.priority = badWord.priority || EPriorityBadWord.Low
  }
}

export let BadWordsCollection: Collection<BadWordSchema>

export function initBadWordsCollection(db: Db) {
  BadWordsCollection = db.collection<BadWordSchema>(COLLECTION_BAD_WORDS_NAME)
}
