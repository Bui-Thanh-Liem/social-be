import { Router } from 'express'

import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { paramsValidate } from '~/utils/params-validate.middleware'
import { queryValidate } from '~/utils/query-validate.middleware'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import MessagesController from './messages.controller'
import { GetMultiMessageByConversationDtoSchema } from './messages.dto'

const messagesRoute = Router()

messagesRoute.use(authenticationMiddleware)

messagesRoute.get(
  '/:conversation_id',
  paramsValidate(GetMultiMessageByConversationDtoSchema),
  queryValidate(QueryDtoSchema),
  asyncHandler(MessagesController.getMultiByConversation)
)

export default messagesRoute
