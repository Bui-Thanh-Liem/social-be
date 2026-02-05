import { removeVietnameseAccent } from '~/utils/remove-vietnamese-accent.util'
import { CreateBadWordDto } from './bad-words.dto'
import { BadWordsCollection } from './bad-words.schema'

export class BadWordsService {
  async create({ body }: { body: CreateBadWordDto }) {
    //
    const newBadWord = await BadWordsCollection.insertOne({
      words: body.words,
      priority: body.priority,
      replace_with: body.replace_with
    })

    //
    return newBadWord
  }

  async replaceBadWordsInText(text: string): Promise<string> {
    removeVietnameseAccent('d')
    //
    const badWords = await BadWordsCollection.find({}).toArray()

    let modifiedText = text

    for (const badWord of badWords) {
      const regex = new RegExp(`\\b${badWord.words}\\b`, 'gi')
      modifiedText = modifiedText.replace(regex, badWord.replace_with)
    }

    return modifiedText
  }
}

export default new BadWordsService()
