import { removeVietnameseAccent } from '~/utils/remove-vietnamese-accent.util'
import { CreateBadWordDto } from './bad-words.dto'
import { BadWordsCollection } from './bad-words.schema'
import { createKeyBadWords } from '~/utils/create-key-cache.util'
import CacheService from '~/helpers/cache.helper'

interface IBadWordsCached {
  original: string
  normalized: string
  replaceWith: string
}

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

    // xóa cache
    await CacheService.del(createKeyBadWords())
    console.log('♻️ Cache cleared due to new bad word')

    //
    return newBadWord
  }

  async replaceBadWordsInText(text: string): Promise<string> {
    const badWords = await this.loadBadWordsFromDB()
    let result = text

    // Sắp xếp từ dài nhất lên trước để tránh replace "từ con" trước "từ cha"
    // Ví dụ: "đồ chó đẻ" nên bị bắt trước từ "chó"
    const sortedBadWords = badWords.sort((a, b) => b.normalized.length - a.normalized.length)

    for (const bw of sortedBadWords) {
      // Tạo pattern linh hoạt: cho phép có ký tự đặc biệt hoặc space giữa các chữ cái
      // Ví dụ: "d m" sẽ khớp với "d.m", "d-m", "d...m"
      const flexiblePattern = bw.normalized.split('').join('[^a-z0-9]*')
      const regex = new RegExp(flexiblePattern, 'gi')

      result = result.replace(regex, bw.replaceWith)
    }

    return result
  }

  private async loadBadWordsFromDB() {
    const keyCache = createKeyBadWords()
    const cached = await CacheService.get<IBadWordsCached[]>(keyCache)
    if (cached) {
      console.log('✅ load bad words từ cache')
      return cached
    }

    const words = await BadWordsCollection.find({}).toArray()
    const badWords = words.map((w) => ({
      original: w.words,
      normalized: this.normalizeContent(w.words),
      replaceWith: w.replace_with
    }))
    await CacheService.set(keyCache, badWords, 3600)
    console.log('✅ load bad words từ database')
    return badWords
  }

  // Tối ưu normalize: Không nên xóa sạch ký tự đặc biệt quá sớm
  private normalizeContent(input: string): string {
    return removeVietnameseAccent(input.toLowerCase())
      .replace(/[013457@$!]/g, (char) => this.LEET_MAP[char] || char)
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
      .trim()
  }
}

export default new BadWordsService()
