import { removeVietnameseAccent } from '~/utils/remove-vietnamese-accent.util'
import { CreateBadWordDto } from './bad-words.dto'
import { BadWordsCollection } from './bad-words.schema'

export class BadWordsService {
  private LEET_MAP: Record<string, string> = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
    '@': 'a',
    $: 's',
    '!': 'i'
  }

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

  replaceBadWordsInText(text: string): string {
    const normalizedText = this.normalizeContent(text)
    let result = text

    for (const bw of this.badWords) {
      const pattern = bw.normalized.split(' ').join('\\s*')

      const regex = new RegExp(pattern, 'gi')

      if (regex.test(normalizedText)) {
        result = result.replace(new RegExp(bw.original, 'gi'), bw.replaceWith)
      }
    }

    return result
  }

  private normalizeContent(input: string): string {
    let text = input.toLowerCase()

    // bỏ dấu tiếng Việt
    text = removeVietnameseAccent(text)

    // replace leetspeak
    text = text.replace(/[013457@$!]/g, (char) => this.LEET_MAP[char] || char)

    // bỏ emoji
    text = text.replace(/[\u{1F300}-\u{1FAFF}]/gu, '')

    // bỏ ký tự đặc biệt (giữ chữ + số + space)
    text = text.replace(/[^a-z0-9\s]/g, ' ')

    // gom nhiều space thành 1
    text = text.replace(/\s+/g, ' ').trim()

    return text
  }
}

export default new BadWordsService()
