import { ObjectId } from 'mongodb'
import { ConflictError } from '~/core/error.response'
import { ActionBadWordDto } from '~/shared/dtos/public/bad-words.dto'
import CacheService from '~/helpers/cache.helper'
import { notificationQueue } from '~/infra/queues'
import { IBadWord, IBadWordsCached } from '~/shared/interfaces/public/bad-word.interface'
import { BadWordSchema, BadWordsCollection } from '~/models/private/bad-word.schema'
import { CONSTANT_JOB } from '~/shared/constants/queue.constant'
import { createKeyBadWord, createKeyBadWords } from '~/utils/create-key-cache.util'
import { getFilterQuery } from '~/utils/get-filter-query.util'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import { removeVietnameseAccent } from '~/utils/remove-vietnamese-accent.util'
import { ENotificationType } from '../../shared/enums/public/notifications.enum'

class BadWordsService {
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

  // Map ngược để dùng trong việc tạo Regex linh hoạt
  private LEET_MAP_REVERSE: Record<string, string> = {
    o: '0',
    i: '1!',
    e: '3',
    a: '4@',
    s: '5$',
    t: '7'
  }

  /**
   * HÀM QUAN TRỌNG: Tạo biến thể cụ thể cho từng ký tự dựa trên từ gốc.
   * Nếu char gốc là 'ặ', nó sẽ chỉ cho phép 'ặ', 'a' (không dấu) và leet speak.
   * Nó sẽ KHÔNG cho phép 'á' (của từ "các").
   */
  private getSpecificVariants(char: string): string {
    const lowerChar = char.toLowerCase()
    const baseChar = removeVietnameseAccent(lowerChar) // 'ặ' -> 'a'
    const leet = this.LEET_MAP_REVERSE[baseChar] || ''

    // Tạo Set các ký tự cho phép: [ký tự gốc có dấu, ký tự không dấu, leet speak]
    const variants = new Set([lowerChar, baseChar, ...leet.split('')])

    // Trả về dạng regex group: [ặa4@]
    return `[${Array.from(variants).join('')}]`
  }

  async create({ body }: { body: ActionBadWordDto }) {
    const exists = await BadWordsCollection.findOne({ words: body.words })
    if (exists) throw new ConflictError('Từ cấm đã tồn tại')

    const newBadWord = await BadWordsCollection.insertOne(
      new BadWordSchema({
        words: body.words,
        action: body.action,
        priority: body.priority,
        replace_with: body.replace_with
      })
    )
    await CacheService.del(createKeyBadWords())
    return newBadWord
  }

  async update({ id, body }: { id: string; body: ActionBadWordDto }) {
    const updatedBadWord = await BadWordsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { words: body.words, action: body.action, priority: body.priority, replace_with: body.replace_with } },
      { returnDocument: 'after' }
    )
    await CacheService.del(createKeyBadWords())
    return updatedBadWord
  }

  async getOneByWords({ words }: { words: string }) {
    const keyCache = createKeyBadWord(words)
    const cached = await CacheService.get<IBadWord>(keyCache)
    if (cached) return cached
    const badWord = await BadWordsCollection.findOne({ words })
    await CacheService.set(keyCache, badWord, 3600)
    return badWord
  }

  async getMulti({ query }: { query: any }) {
    const { skip, limit, sort, q, qf } = getPaginationAndSafeQuery<IBadWord>(query)
    let filter: Partial<Record<keyof IBadWord, any>> = q ? { words: { $regex: q, $options: 'i' } } : {}

    //
    filter = getFilterQuery(qf, filter)

    //
    const [badWords, total] = await Promise.all([
      BadWordsCollection.aggregate<BadWordSchema>([
        { $match: filter },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit }
      ]).toArray(),
      BadWordsCollection.countDocuments(filter)
    ])

    //
    return { total, total_page: Math.ceil(total / limit), items: badWords }
  }

  async getMultiMostUsed({ query }: { query: any }) {
    const { limit, skip } = getPaginationAndSafeQuery<IBadWord>(query)
    const badWords = await BadWordsCollection.find({}).sort({ usage_count: -1 }).limit(limit).skip(skip).toArray()
    const total = await BadWordsCollection.countDocuments({})
    return { total, total_page: Math.ceil(total / limit), items: badWords }
  }

  async delete({ id }: { id: string }) {
    const deletedBadWord = await BadWordsCollection.findOneAndDelete({ _id: new ObjectId(id) })
    await CacheService.del(createKeyBadWords())
    return deletedBadWord
  }

  //
  private async incrementUsageCount(words: string, user_id: string) {
    // Warn
    notificationQueue.add(CONSTANT_JOB.SEND_NOTI, {
      content: 'Bạn đã sử dụng một số từ ngữ không phù hợp, vui lòng chú ý hơn.',
      type: ENotificationType.Other,
      receiver: user_id,
      sender: user_id
    })

    //
    return await BadWordsCollection.findOneAndUpdate(
      { words },
      { $inc: { usage_count: 1 } },
      { returnDocument: 'after', includeResultMetadata: false }
    )
  }

  async detectInText({ text, user_id }: { text: string; user_id: string }) {
    const badWords = await this.loadBadWordsFromDB()
    let result = text
    let violated = false
    const matched_words: string[] = []
    const bad_words_ids: string[] = []

    // Sắp xếp từ dài nhất lên trước
    const sortedBadWords = badWords.sort((a, b) => b.normalized.length - a.normalized.length)

    for (const bw of sortedBadWords) {
      /**
       * CHIẾN THUẬT MỚI:
       * Dựa trên từ GỐC (bw.original) để tạo pattern.
       * Ví dụ: "c*c" -> c + [ặa] + c
       * "các" (vô hại) nhập vào sẽ không khớp vì 'á' không nằm trong [ặa]
       */
      const flexiblePattern = bw.original
        .split('')
        .map((char) => {
          // Chỉ xử lý biến thể cho chữ cái, ký tự khác giữ nguyên
          if (/[a-zA-Zà-ỹÀ-Ỹ]/.test(char)) {
            return `${this.getSpecificVariants(char)}[^a-z0-9]*`
          }
          return `${char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^a-z0-9]*`
        })
        .join('')

      // Ranh giới từ: không bắt nếu dính liền với chữ/số khác
      const strictPattern = `(?<![a-z0-9à-ỹÀ-Ỹ])${flexiblePattern}(?![a-z0-9à-ỹÀ-Ỹ])`
      const regex = new RegExp(strictPattern, 'gi')

      if (regex.test(result)) {
        violated = true
        matched_words.push(bw.original)
        bad_words_ids.push(bw._id)
        regex.lastIndex = 0
        result = result.replace(regex, bw.replaceWith)
      }
    }

    if (violated) {
      const uniqueOriginals = [...new Set(matched_words)]
      await Promise.all(uniqueOriginals.map((word) => this.incrementUsageCount(word, user_id)))
      return {
        matched_words: uniqueOriginals,
        text: result,
        bad_words_ids: [...new Set(bad_words_ids)]
      }
    }

    return { matched_words: [], text: result, bad_words_ids: [] }
  }

  private async loadBadWordsFromDB() {
    const keyCache = createKeyBadWords()
    const cached = await CacheService.get<IBadWordsCached[]>(keyCache)
    if (cached) return cached

    const words = await BadWordsCollection.find({}).toArray()
    const badWords = words.map((w) => ({
      _id: (w as any)._id.toString(),
      original: w.words,
      normalized: this.normalizeContent(w.words),
      replaceWith: w.replace_with
    }))
    await CacheService.set(keyCache, badWords, 3600)
    return badWords
  }

  private normalizeContent(input: string): string {
    let normalized = removeVietnameseAccent(input.toLowerCase())
    Object.keys(this.LEET_MAP).forEach((key) => {
      normalized = normalized.replace(new RegExp(`\\${key}`, 'g'), this.LEET_MAP[key])
    })
    return normalized.replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim()
  }
}

export default new BadWordsService()
