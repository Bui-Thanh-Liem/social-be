import { signedCloudfrontUrl } from '~/cloud/aws/cloudfront.aws'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { IMedia } from '~/shared/interfaces/schemas/media.interface'
import { IUser } from '~/shared/interfaces/schemas/user.interface'
import { ResMultiType } from '~/shared/types/response.type'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import { MediasCollection } from './media.schema'

class MediaService {
  //
  async adminGetMedia({ admin_id, query }: { admin_id: string; query: IQuery<IMedia> }): Promise<ResMultiType<IMedia>> {
    const { skip, limit, sort } = getPaginationAndSafeQuery<IMedia>(query)

    const [items, total] = await Promise.all([
      MediasCollection.aggregate<IMedia>([
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
        ...signedCloudfrontUrl(medias),
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
        ...signedCloudfrontUrl(media),
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
