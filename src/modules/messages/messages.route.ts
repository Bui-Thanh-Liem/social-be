import { Router } from 'express'

import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import MessagesController from './messages.controller'
import { GetMultiMessageByConversationDtoSchema } from './messages.dto'

const messagesRoute = Router()

// Các route dưới đây cần authentication
messagesRoute.use(authenticationMiddleware)

// Lấy danh sách message theo conversation
messagesRoute.get(
  '/:conversation_id',
  paramsValidate(GetMultiMessageByConversationDtoSchema),
  queryValidate(QueryDtoSchema),
  asyncHandler(MessagesController.getMultiByConversation)
)

export default messagesRoute
