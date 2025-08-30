import { Router } from 'express'
import ConversationsController from '~/controllers/Conversations.controller'
import { requestBodyValidate } from '~/middlewares/requestBodyValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserEmail } from '~/middlewares/verifyUserEmail.middleware'
import { CreateConversationDtoSchema } from '~/shared/dtos/req/conversation.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const conversationsRoute = Router()

conversationsRoute.post(
  '/',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(CreateConversationDtoSchema),
  wrapAsyncHandler(ConversationsController.create)
)

export default conversationsRoute
