import { signedCloudfrontUrl } from '~/cloud/aws/cloudfront.aws'
import { IMedia } from '~/shared/interfaces/common/media.interface'
import { IUser } from '~/shared/interfaces/public/user.interface'
import { MediasCollection } from '~/schemas/common/media.schema'
import { ResMultiDto } from '~/shared/dtos/common/res-multi.dto'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { getFilterQuery } from '~/utils/get-filter-query.util'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'

class MediaService {
  async getMedias({ admin_id, query }: { admin_id: string; query: IQuery<IMedia> }): Promise<ResMultiDto<IMedia>> {
    const { skip, limit, sort, qf, sd, ed } = getPaginationAndSafeQuery<IMedia>(query)
    const filter = getFilterQuery({ qf: qf as any, filter: {}, sd, ed })

    const [items, total] = await Promise.all([
      MediasCollection.aggregate<IMedia>([
        { $match: filter },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_id',
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  avatar: 1,
                  username: 1
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
      ]).toArray(),
      MediasCollection.countDocuments()
    ])

    return {
      total,
      total_page: Math.ceil(total / limit),
      items: this.signedCloudfrontUrls(items) as unknown as IMedia[]
    }
  }

  //
  private signedCloudfrontUrls = (medias: IMedia[] | IMedia | null) => {
    //
    if (!medias) return medias

    //
    if (!Array.isArray(medias)) {
      const user = medias.user_id as unknown as IUser
      return {
        ...medias,
        ...signedCloudfrontUrl(medias as any),
        user_id: user?.avatar
          ? {
              ...user,
              avatar: signedCloudfrontUrl(user.avatar)
            }
          : null
      }
    }

    //
    return medias.map((media) => {
      const user = media.user_id as unknown as IUser
      return {
        ...media,
        ...signedCloudfrontUrl(media as any),
        user_id: user?.avatar
          ? {
              ...user,
              avatar: signedCloudfrontUrl(user.avatar)
            }
          : null
      }
    })
  }
}

export default new MediaService()
