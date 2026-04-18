import { ObjectId } from 'mongodb'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import { COLLECTION_USERS_NAME } from '~/schemas/public/user.schema'
import { CreateUserViolationsDto } from '~/shared/dtos/public/user-violations.dto'
import { IUserViolation } from '~/shared/interfaces/public/user-violation.interface'
import { ResMultiDto } from '~/shared/dtos/common/res-multi.dto'
import { UserViolationSchema, UserViolationsCollection } from '~/schemas/public/user-violation.schema'

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

  async getMulti({ queries }: { queries: IQuery<IUserViolation> }): Promise<ResMultiDto<IUserViolation>> {
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
          from: COLLECTION_USERS_NAME,
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
