import { TweetsCollection, TweetsSchema } from '~/models/public/tweet.schema'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { ResMultiDto } from '~/shared/dtos/common/res-multi.dto'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import { getFilterQuery } from '~/utils/get-filter-query.util'
import { COLLECTION_USERS_NAME } from '~/models/public/user.schema'
import tweetsService from '../tweets.service'

export async function adminGetTweetsHelper({
  query
}: {
  admin_id: string
  query: IQuery<TweetsSchema>
}): Promise<ResMultiDto<TweetsSchema>> {
  const { skip, limit, sort, q, qf, sd, ed } = getPaginationAndSafeQuery<TweetsSchema>(query)
  let filter: any = q ? { $text: { $search: q } } : {}

  //
  filter = getFilterQuery<TweetsSchema>({ qf, filter, sd, ed })

  //
  const tweets = await TweetsCollection.aggregate<TweetsSchema>([
    {
      $match: filter
    },
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
        from: 'communities',
        localField: 'community_id',
        foreignField: '_id',
        as: 'community_id',
        pipeline: [
          {
            $project: {
              cover: 1,
              name: 1,
              slug: 1
            }
          }
        ]
      }
    },
    {
      $unwind: { path: '$community_id', preserveNullAndEmptyArrays: true }
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
              email: 1,
              avatar: 1,
              verify: 1,
              cover_photo: 1
            }
          }
        ]
      }
    },
    {
      $unwind: { path: '$user_id', preserveNullAndEmptyArrays: true }
    },
    {
      $lookup: {
        from: COLLECTION_USERS_NAME,
        localField: 'mentions',
        foreignField: '_id',
        as: 'mentions',
        pipeline: [
          {
            $project: {
              name: 1,
              username: 1,
              avatar: 1,
              verify: 1,
              bio: 1
            }
          }
        ]
      }
    }
  ]).toArray()

  const total = await TweetsCollection.countDocuments(filter)

  return {
    total,
    total_page: Math.ceil(total / limit),
    items: tweetsService.signedCloudfrontMediaUrls(tweets) as TweetsSchema[]
  }
}
