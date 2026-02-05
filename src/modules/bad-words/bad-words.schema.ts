import { Collection, Db } from 'mongodb'
import { EPriorityBadWord } from '~/shared/enums/common.enum'
import { IBadWord } from '~/shared/interfaces/schemas/bad-word.interface'
import { BaseSchema } from '~/shared/schemas/base.schema'

export class BadWordSchema extends BaseSchema implements IBadWord {
  words: string
  priority: EPriorityBadWord
  replace_with: string

  constructor(badWord: Pick<IBadWord, 'words' | 'priority' | 'replace_with'>) {
    super()
    this.words = badWord.words || ''
    this.priority = badWord.priority || EPriorityBadWord.Low
    this.replace_with = badWord.replace_with || ''
  }
}

export let BadWordsCollection: Collection<BadWordSchema>

export function initBadWordsCollection(db: Db) {
  BadWordsCollection = db.collection<BadWordSchema>('bad-words')
}
