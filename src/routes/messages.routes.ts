import { Router } from 'express'
import MessagesController from '~/controllers/Messages.controller'
import { requestParamsValidate } from '~/middlewares/request-params-validate.middleware'
import { requestQueryValidate } from '~/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { GetMultiMessageByConversationDtoSchema } from '~/shared/dtos/req/message.dto'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { wrapAsyncHandler } from '~/utils/wrap-async-handler.util'

const messagesRoute = Router()

messagesRoute.get(
  '/:conversation_id',
  verifyAccessToken,
  requestParamsValidate(GetMultiMessageByConversationDtoSchema),
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(MessagesController.getMultiByConversation)
)

export default messagesRoute
