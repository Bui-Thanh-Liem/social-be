import { ObjectId } from 'mongodb'
import { BadRequestError } from '~/core/error.response'
import { ESourceViolation } from '~/shared/enums/common.enum'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import { slug } from '~/utils/slug.util'
import BadWordsService from '../bad-words/bad-words.service'
import UserViolationsService from '../user-violations/user-violations.service'
import { IHashtag } from './hashtags.interface'
import { HashtagsCollection, HashtagsSchema } from './hashtags.schema'

class HashtagsService {
  //
  async getMulti({ query }: { query: IQuery<IHashtag> }): Promise<ResMultiType<IHashtag>> {
    const { skip, limit, sd, ed, q, sort } = getPaginationAndSafeQuery<IHashtag>(query)
    const match = {} as any

    //
    if (sd || ed) {
      match.created_at = {}
      if (sd) match.created_at.$gte = new Date(sd)
      if (ed) match.created_at.$lte = new Date(ed)
    }

    // Kiểm tra tính hợp lệ của sd và ed
    if (sd && ed && sd > ed) {
      throw new BadRequestError('Ngày bắt đầu phải lớn hơn ngày kết thúc')
    }

    //
    if (q) {
      match.slug = { $regex: q, $options: 'i' }
    }

    //
    const trending = await HashtagsCollection.aggregate<HashtagsSchema>([
      { $match: match },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit }
    ]).toArray()

    const total = await HashtagsCollection.countDocuments(match)
    return { total, total_page: Math.ceil(total / limit), items: trending }
  }

  //
  async checkHashtags(names: string[] | undefined, user_id: string): Promise<ObjectId[]> {
    if (!names || names.length === 0) return []
    const results = await Promise.all(
      names.map(async (name) => {
        const _slug = slug(name)

        // Lọc từ cấm trong tên hashtag
        const _name = await BadWordsService.detectInText({
          text: name,
          user_id: user_id
        })

        //
        const newHashtag = await HashtagsCollection.findOneAndUpdate(
          { slug: _slug },
          { $setOnInsert: new HashtagsSchema({ name: _name.text }) },
          { upsert: true, returnDocument: 'after' }
        )

        // Lưu vi phạm từ cấm nếu có
        if (_name.bad_words_ids.length > 0) {
          await UserViolationsService.create({
            user_id: user_id,
            source_id: user_id,
            source: ESourceViolation.Hashtag,
            final_content: _name.matched_words.join() || '',
            bad_word_ids: _name.bad_words_ids
          })
        }

        return newHashtag
      })
    )

    return results.map((result) => result?._id).filter(Boolean) as ObjectId[]
  }
}

export default new HashtagsService()
