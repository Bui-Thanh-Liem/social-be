import { Router } from 'express'
import MessagesController from '~/controllers/Messages.controller'
import { requestParamsValidate } from '~/middlewares/requestParamsValidate.middleware'
import { requestQueryValidate } from '~/middlewares/requestQueryValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { GetMultiMessageByConversationDtoSchema } from '~/shared/dtos/req/message.dto'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

const messagesRoute = Router()

messagesRoute.get(
  '/:conversation_id',
  verifyAccessToken,
  requestParamsValidate(GetMultiMessageByConversationDtoSchema),
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(MessagesController.getMultiByConversation)
)

export default messagesRoute
