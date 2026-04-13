import { CreateReelDto } from '~/dtos/public/reels.dto'
import badWordsService from '../private/bad-words.service'
import { IMedia } from '~/interfaces/common/media.interface'
import uploadsService from './uploads.service'
import hashtagsService from './hashtags.service'
import { EReelStatus, EReelType } from '~/enums/public/reel.enum'
import trendingService from './trending.service'
import { CONSTANT_JOB, CONSTANT_REGEX } from '~/shared/constants'
import { ReelsCollection, ReelsSchema } from '~/models/public/reels.schema'
import { ObjectId } from 'mongodb'
import userViolationsService from './user-violations.service'
import { ESourceViolation } from '~/enums/public/user-violations.enum'
import { COLLECTION_USERS_NAME, UsersCollection } from '~/models/public/users.schema'
import { chunkArray } from '~/utils/chunk-array'
import { ENotificationType } from '~/enums/public/notifications.enum'
import { notificationQueue } from '~/infra/queues'
import { IQuery } from '~/shared/interfaces/query.interface'
import { IReel } from '~/interfaces/public/reel.interface'
import { getPaginationAndSafeQuery } from '~/utils/get-pagination-and-safe-query.util'
import { signedCloudfrontUrl } from '~/cloud/aws/cloudfront.aws'
import { NotFoundError } from '~/core/error.response'
import { clientMongodb } from '~/database/mongodb.db'
import usersService from './users.service'

class ReelService {
  async create(user_id: string, createReelDto: CreateReelDto) {
    const { content, video, hashtags, type, mentions, isPinAvatar } = createReelDto

    // Lọc từ cấm trong content
    const _content = await badWordsService.detectInText({
      text: content || '',
      user_id
    })

    // Lấy thông tin media nếu có
    let _video: undefined | IMedia[] = undefined
    if (video) {
      _video = await uploadsService.getMultiByKeys([video.s3_key])
    }

    // Tạo hashtags chop tweet
    const _hashtags = await hashtagsService.checkHashtags(hashtags, user_id)

    // Thêm hashtag vào trending, nếu là reel (không ẩn trong 24h)
    if (hashtags?.length && type !== EReelType.Reel) {
      await Promise.all(hashtags.map((hashtagName) => trendingService.createTrending(`#${hashtagName}`, user_id)))
    }

    // Thêm từ khóa vào trending (những từ trong content, nhưng được viết in hoa)
    if (_content && type !== EReelType.Reel) {
      const keyWords = _content.text.match(CONSTANT_REGEX.FIND_KEYWORD) || []
      await Promise.all(keyWords.map((w) => trendingService.createTrending(w, user_id)))
    }

    //
    const newReel = await ReelsCollection.insertOne(
      new ReelsSchema({
        type,
        hashtags: _hashtags,
        isPinAvatar: isPinAvatar,
        user: new ObjectId(user_id),
        content: _content ? _content.text : undefined,
        video: _video ? _video[0] : ({ s3_key: '', url: '' } as IMedia),
        mentions: mentions ? mentions.map((id) => new ObjectId(id)) : []
      })
    )

    //
    if (isPinAvatar) {
      await usersService.pinnedReel({ user_id, isPinned: isPinAvatar })
    }

    // Lưu vi phạm từ cấm nếu có
    if (_content.bad_words_ids.length > 0) {
      await userViolationsService.create({
        user_id: user_id,
        source: ESourceViolation.Reel,
        bad_word_ids: _content.bad_words_ids,
        source_id: newReel.insertedId.toString(),
        final_content: _content.matched_words.join() || ''
      })
    }

    // Mentions
    const sender = await UsersCollection.findOne({ _id: new ObjectId(user_id) }, { projection: { name: 1 } })

    // Gửi thông báo cho ai mà người dùng nhắc đến trong reel (mentions)
    if (mentions?.length) {
      // Nếu nhiều hơn 50 thành viên → tách nhỏ thành nhiều chunk để tránh lỗi payload quá lớn
      const chunks = chunkArray(mentions, 50)
      for (const chunk of chunks) {
        //
        const jobs = chunk.map((receiverId) => ({
          name: CONSTANT_JOB.SEND_NOTI,
          data: {
            sender: user_id,
            receiver: receiverId,
            type: ENotificationType.Mention_like,
            ref_id: newReel.insertedId.toString(),
            content: `${sender?.name} đã nhắc đến bạn trong một bản tin.`
          },
          opts: {
            removeOnComplete: true,
            attempts: 3 // retry nếu queue bị lỗi
          }
        }))

        await notificationQueue.addBulk(jobs)
      }
    }
  }

  //
  async changeStatusReel({ user_id, reel_id, status }: { user_id: string; reel_id: string; status: EReelStatus }) {
    const reel = await ReelsCollection.findOne(
      { _id: new ObjectId(reel_id), user: new ObjectId(user_id) },
      { projection: { _id: 1, status: 1, user_id: 1 } }
    )

    if (!reel) {
      throw new NotFoundError('Tin không tồn tại hoặc đã bị gỡ bỏ.')
    }

    await ReelsCollection.updateOne({ _id: new ObjectId(reel_id) }, { $set: { status: status } })

    return this.signedCloudfrontMediaUrls(reel) as ReelsSchema
  }

  //
  async getNewFeed({ query, user_active_id }: { query: IQuery<IReel>; user_active_id: string }) {
    //
    const activeObjectId = user_active_id ? new ObjectId(user_active_id) : null
    const { skip, limit, sort } = getPaginationAndSafeQuery<IReel>(query)

    //
    const condition = { status: EReelStatus.Ready }
    const reels = await ReelsCollection.aggregate<ReelsSchema>([
      {
        $match: condition
      },
      {
        // 1. Tạo một field để đánh dấu độ ưu tiên
        $addFields: {
          priority: {
            $cond: {
              if: { $eq: ['$user', activeObjectId] }, // Kiểm tra nếu author_id trùng với user_active_id
              then: 1,
              else: 0
            }
          }
        }
      },
      {
        // 2. Sắp xếp theo priority giảm dần (1 lên trước 0)
        // Sau đó mới đến các tiêu chí sắp xếp mặc định của bạn
        $sort: {
          priority: -1,
          ...sort
        }
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
          localField: 'user',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { name: 1, username: 1, avatar: 1 } }]
        }
      },
      {
        $unwind: '$user'
      },
      {
        // 3. (Tùy chọn) Loại bỏ field priority sau khi dùng xong để data sạch
        $project: { priority: 0 }
      }
    ]).toArray()

    //
    const total = await ReelsCollection.countDocuments(condition)
    return { total, total_page: Math.ceil(total / limit), items: this.signedCloudfrontMediaUrls(reels) }
  }

  //
  async getProfileReels({
    query,
    user_id,
    user_active_id
  }: {
    user_id: string
    query: IQuery<IReel>
    user_active_id: string
  }) {
    //
    const { skip, limit, sort } = getPaginationAndSafeQuery<IReel>(query)

    //
    const match_condition: any = {
      user: new ObjectId(user_id),
      status: EReelStatus.Ready
    }

    // Nếu người xem profile là chính chủ, cho phép xem cả reel ẩn
    if (user_active_id === user_id) {
      delete match_condition.status
    }

    //
    const reels = await ReelsCollection.aggregate<ReelsSchema>([
      { $match: match_condition },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: COLLECTION_USERS_NAME,
          localField: 'user',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { name: 1, username: 1, avatar: 1 } }]
        }
      },
      {
        $unwind: '$user'
      }
    ]).toArray()

    const total = await ReelsCollection.countDocuments(match_condition)
    return { total, total_page: Math.ceil(total / limit), items: this.signedCloudfrontMediaUrls(reels) }
  }

  //
  async delete(user_id: string, reel_id: string) {
    const session = clientMongodb.startSession()
    try {
      await session.withTransaction(async () => {
        // Lấy reel trước
        const reel = await ReelsCollection.findOne({ _id: new ObjectId(reel_id), user: new ObjectId(user_id) })
        if (!reel) {
          throw new NotFoundError('Không tìm thấy tin để xóa')
        }

        // Xoá DB trước
        const result = await ReelsCollection.deleteOne({ _id: new ObjectId(reel_id) })
        if (result.deletedCount === 0) {
          throw new NotFoundError('Không tìm thấy tin để xóa')
        }

        // Xóa medias khỏi S3
        if (reel.video) {
          await uploadsService.delete({ s3_keys: [reel.video.s3_key] })
        }
      })
      return true
    } catch (error) {
      console.error('Lỗi xóa reel:', error)
      throw error
    } finally {
      session.endSession()
    }
  }

  //
  signedCloudfrontMediaUrls = (reels: IReel[] | IReel | null) => {
    //
    if (!reels) return reels

    //
    if (!Array.isArray(reels))
      return {
        ...reels,
        video: {
          ...reels.video,
          ...signedCloudfrontUrl(reels.video)
        }
      }

    //
    return reels.map((reel) => ({
      ...reel,
      video: {
        ...reel.video,
        ...signedCloudfrontUrl(reel.video)
      }
    }))
  }
}

export default new ReelService()
