import { Request, Response } from 'express'
import { CreatedResponse, OkResponse } from '~/core/success.response'
import { GetNewFeedTypeDto, GetProfileTweetDto, GetTweetChildrenDtoParams } from '~/shared/dtos/public/tweets.dto'
import { ITweet } from '~/shared/interfaces/public/tweet.interface'
import TweetsService from '~/services/public/tweets/tweets.service'
import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import { IQuery } from '~/shared/interfaces/common/query.interface'
import { AdminChangeTweetStatusDto, AdminRemindTweetDto } from '~/shared/dtos/private/tweet.dto'
import { IUser } from '~/shared/interfaces/public/user.interface'

class TweetsController {
  async create(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload
    const { type } = req.user as IUser
    const { message, result } = await TweetsService.create(user_id!, type, req.body)
    res.status(201).json(new CreatedResponse(message, result))
  }

  async getOneById(req: Request, res: Response) {
    const user = req?.decoded_authorization as IJwtPayload
    console.log('req.params.id::', req.params.id)

    // const tweet = req.tweet as ITweet
    // const { guest_view, user_view, created_at } = await TweetsService.increaseView(tweet._id!, user?.user_id)
    const tweeDetail = await TweetsService.getOneById({
      id: req.params.id,
      user_active_id: user?.user_id
    })

    // tweet.guest_view = guest_view
    // tweet.user_view = user_view
    // tweet.created_at = created_at

    // Trả về ngay tại controller vì ở middleware đã query rồi
    res.status(200).json(new OkResponse('Get tweet Success', tweeDetail))
  }

  async getTweetChildren(req: Request, res: Response) {
    const { id, tweet_type } = req.params as unknown as GetTweetChildrenDtoParams
    const user = req?.decoded_authorization as IJwtPayload

    const tweets = await TweetsService.getTweetChildren({
      id,
      tweet_type,
      query: req.query,
      user_id: user?.user_id
    })

    res.status(200).json(new OkResponse('Get tweet children Success', tweets))
  }

  async getNewFeeds(req: Request, res: Response) {
    const user = req?.decoded_authorization as IJwtPayload
    const { feed_type } = req.params as GetNewFeedTypeDto

    const result = await TweetsService.getNewFeeds({
      feed_type,
      query: req.query,
      user_active_id: user?.user_id
    })
    res.status(200).json(new OkResponse('Get new feeds success', result))
  }

  async getProfileTweets(req: Request, res: Response) {
    const user = req?.decoded_authorization as IJwtPayload
    const { tweet_type } = req.params as unknown as GetProfileTweetDto
    const queries = req.query as IQuery<ITweet>

    const result = await TweetsService.getProfileTweets({
      tweet_type,
      query: queries,
      user_active_id: user?.user_id,
      isHighlight: queries?.ishl === '1',
      isMedia: queries?.isMedia === '1',
      user_id: queries?.user_id as string
    })
    res.status(200).json(new OkResponse('Get profile tweet success', result))
  }

  async getTweetsByCommunityId(req: Request, res: Response) {
    const user = req?.decoded_authorization as IJwtPayload
    const queries = req.query as IQuery<ITweet>

    const result = await TweetsService.getTweetsByCommunityId({
      query: queries,
      user_active_id: user?.user_id,
      isHighlight: queries?.ishl === '1',
      isMedia: queries?.isMedia === '1',
      community_id: queries?.community_id as string
    })
    res.status(200).json(new OkResponse('Get community tweet success', result))
  }

  async getTweetsPendingByCommunityId(req: Request, res: Response) {
    const { user_id } = req?.decoded_authorization as IJwtPayload
    const queries = req.query as IQuery<ITweet>

    const result = await TweetsService.getTweetsPendingByCommunityId({
      query: queries,
      user_active_id: user_id!,
      community_id: queries?.community_id as string
    })
    res.status(200).json(new OkResponse('Lấy tất vả bài viết chưa duyệt thành công.', result))
  }

  async getTweetLiked(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload

    const result = await TweetsService.getTweetLiked({
      query: req.query,
      user_active_id: user_id!
    })
    res.status(200).json(new OkResponse('Lấy bài viết đã thích thành công', result))
  }

  async getTweetBookmarked(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as IJwtPayload

    const result = await TweetsService.getTweetBookmarked({
      query: req.query,
      user_active_id: user_id!
    })
    res.status(200).json(new OkResponse('Lấy bài viết đã lưu thành công', result))
  }

  async delete(req: Request, res: Response) {
    const result = await TweetsService.delete(req.params.id)
    res.status(200).json(new OkResponse('Gỡ bài viết thành công', result))
  }

  async countViewLinkBookmarkInWeek(req: Request, res: Response) {
    const user = req.decoded_authorization as IJwtPayload
    const result = await TweetsService.countViewLinkBookmarkInWeek(user?.user_id || '')
    res.status(200).json(new OkResponse('Thống kê lượt xem, thích, lưu trong tuần thành công', result))
  }

  // ========= Admin =========
  async adminGetTweets(req: Request, res: Response) {
    const { admin_id } = req.decoded_authorization as IJwtPayload
    const result = await TweetsService.adminGetTweets({
      admin_id,
      query: req.queryParsed as IQuery<ITweet>
    })
    res.json(new OkResponse('Lấy danh sách bài viết thành công', result))
  }

  async adminChangeTweetStatus(req: Request, res: Response) {
    const { admin_id } = req.decoded_authorization as IJwtPayload
    const { user_id: author } = req.tweet as ITweet
    const { status, reason } = req.body as AdminChangeTweetStatusDto
    const result = await TweetsService.adminChangeTweetStatus({
      reason,
      status,
      admin_id,
      tweet_id: req.params.id,
      auth_id: (author as unknown as IUser)._id?.toString() || ''
    })
    res.json(new OkResponse('Thay đổi trạng thái bài viết thành công', result))
  }

  async adminRemindTweet(req: Request, res: Response) {
    const { admin_id } = req.decoded_authorization as IJwtPayload
    const { reason } = req.body as AdminRemindTweetDto
    const { user_id: author } = req.tweet as ITweet

    const result = await TweetsService.adminRemindTweet({
      reason,
      admin_id,
      tweet_id: req.params.id,
      auth_id: (author as unknown as IUser)._id?.toString() || ''
    })
    res.json(new OkResponse('Nhắc nhở bài viết thành công', result))
  }

  async adminDeleteTweet(req: Request, res: Response) {
    const { admin_id } = req.decoded_authorization as IJwtPayload
    const { reason } = req.body as AdminRemindTweetDto
    const { user_id: author } = req.tweet as ITweet

    const result = await TweetsService.adminDeleteTweet({
      reason,
      admin_id,
      tweet_id: req.params.id,
      auth_id: (author as unknown as IUser)._id?.toString() || ''
    })
    res.json(new OkResponse('Xóa bài viết thành công', result))
  }

  // ========= Admin =========
}

export default new TweetsController()
