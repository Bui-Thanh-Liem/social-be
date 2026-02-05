import { Router } from 'express'
import { requestParamsValidate } from '~/shared/middlewares/request-params-validate.middleware'
import { requestQueryValidate } from '~/shared/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/shared/middlewares/user/verify-access-token.middleware'
import { verifyUserEmail } from '~/shared/middlewares/user/verify-user-email.middleware'
import { GetMultiMessageByConversationDtoSchema } from '~/shared/dtos/req/message.dto'
import { QueryDtoSchema } from '~/shared/dtos/req/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'
import MessagesController from './messages.controller'

const messagesRoute = Router()

messagesRoute.use(verifyAccessToken, verifyUserEmail)

messagesRoute.get(
  '/:conversation_id',
  requestParamsValidate(GetMultiMessageByConversationDtoSchema),
  requestQueryValidate(QueryDtoSchema),
  asyncHandler(MessagesController.getMultiByConversation)
)

export default messagesRoute
