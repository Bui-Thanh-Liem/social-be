import { Router } from 'express'
import ConversationsController from '~/controllers/Conversations.controller'
import { checkExistParticipants } from '~/middlewares/checkExistParticipants.middleware'
import { requestBodyValidate } from '~/middlewares/requestBodyValidate.middleware'
import { requestQueryValidate } from '~/middlewares/requestQueryValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserEmail } from '~/middlewares/verifyUserEmail.middleware'
import { CreateConversationDtoSchema } from '~/shared/dtos/req/conversation.dto'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const conversationsRoute = Router()

conversationsRoute.post(
  '/',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(CreateConversationDtoSchema),
  checkExistParticipants,
  wrapAsyncHandler(ConversationsController.create)
)

conversationsRoute.get(
  '/',
  verifyAccessToken,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(ConversationsController.getMulti)
)

export default conversationsRoute
