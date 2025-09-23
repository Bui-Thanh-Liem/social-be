import { ObjectId } from 'mongodb'
import { HashtagCollection, HashtagSchema } from '~/models/schemas/Hashtag.schema'
import { BadRequestError } from '~/shared/classes/error.class'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { IHashtag } from '~/shared/interfaces/schemas/hashtag.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/getPaginationAndSafeQuery.util'
import { slug } from '~/utils/slug.util'

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
    const trending = await HashtagCollection.aggregate<HashtagSchema>([
      { $match: match },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit }
    ]).toArray()

    const total = await HashtagCollection.countDocuments(match)
    return { total, total_page: Math.ceil(total / limit), items: trending }
  }

  //
  async checkHashtags(names: string[] | undefined) {
    if (!names || names.length === 0) return []
    const results = await Promise.all(
      names.map((name) => {
        const _slug = slug(name)
        return HashtagCollection.findOneAndUpdate(
          { slug: _slug },
          { $setOnInsert: new HashtagSchema({ name }) },
          { upsert: true, returnDocument: 'after' }
        )
      })
    )

    return results.map((result) => result?._id).filter(Boolean) as ObjectId[]
  }
}

export default new HashtagsService()
