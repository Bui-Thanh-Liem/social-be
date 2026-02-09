import { ObjectId } from 'mongodb'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import { CreateUserViolationsDto } from './user-violations.dto'
import { IUserViolation } from './user-violations.interface'
import { UserViolationSchema, UserViolationsCollection } from './user-violations.schema'

class UserViolationsService {
  async create(payload: CreateUserViolationsDto) {
    return await UserViolationsCollection.insertOne(
      new UserViolationSchema({
        source: payload.source,
        final_content: payload.final_content,
        user_id: new ObjectId(payload.user_id),
        source_id: new ObjectId(payload.source_id),
        bad_word_ids: payload.bad_word_ids.map((id) => new ObjectId(id))
      })
    )
  }

  async getMulti({ queries }: { queries: IQuery<IUserViolation> }): Promise<ResMultiType<IUserViolation>> {
    const { skip, limit, sort } = getPaginationAndSafeQuery<IUserViolation>(queries)

    const userViolations = await UserViolationsCollection.aggregate<UserViolationSchema>([
      {
        $sort: sort
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user_id',
          pipeline: [
            {
              $project: {
                name: 1,
                username: 1,
                avatar: 1
              }
            }
          ]
        }
      },
      {
        $unwind: {
          path: '$user_id',
          preserveNullAndEmptyArrays: true
        }
      }
    ]).toArray()

    const total = await UserViolationsCollection.countDocuments()

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: userViolations
    }
  }
}

export default new UserViolationsService()
