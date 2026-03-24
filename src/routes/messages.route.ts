import { Router } from 'express'

import messagesController from '~/controllers/messages.controller'
import { GetMultiMessageByConversationDtoSchema } from '~/dtos/messages.dto'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const messagesRoute = Router()

// Các route dưới đây cần authentication
messagesRoute.use(authenticationMiddleware)

// Lấy danh sách message theo conversation
messagesRoute.get(
  '/:conversation_id',
  paramsValidate(GetMultiMessageByConversationDtoSchema),
  queryValidate(QueryDtoSchema),
  asyncHandler(messagesController.getMultiByConversation)
)

export default messagesRoute
