import { Router } from 'express'
import LikesController from '~/controllers/Likes.controller'
import { checkTweetExist } from '~/middlewares/tweet/check-tweet-exist.middleware'
import { requestParamsValidate } from '~/middlewares/request-params-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyUserEmail } from '~/middlewares/user/verify-user-email.middleware'
import { paramIdTweetDtoSchema } from '~/shared/dtos/req/tweet.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const likesRoute = Router()

likesRoute.use(verifyAccessToken, verifyUserEmail)

likesRoute.post(
  '/toggle/:tweet_id',
  requestParamsValidate(paramIdTweetDtoSchema),
  checkTweetExist,
  asyncHandler(LikesController.toggleLike)
)

export default likesRoute
