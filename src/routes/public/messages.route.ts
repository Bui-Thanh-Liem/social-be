import { Router } from 'express'

import messagesController from '~/controllers/public/messages.controller'
import { GetMultiMessageByConversationDtoSchema } from '~/dtos/public/messages.dto'
import { authenticationUserMiddleware } from '~/middlewares/public/authentication-user.middleware'
import { paramsValidate } from '~/middlewares/common/params-validate.middleware'
import { queryValidate } from '~/middlewares/common/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

/**
 * @module MessagesRoutes
 * @description Quản lý các API liên quan đến tin nhắn, bao gồm lấy danh sách tin nhắn theo cuộc trò chuyện, v.v.
 */

const messagesRoute = Router()

/**
 * @description Middleware xác thực để bảo vệ các route tiếp theo, chỉ cho phép truy cập nếu người dùng đã đăng nhập.
 */
messagesRoute.use(authenticationUserMiddleware)

/**
 * @description API để lấy danh sách tin nhắn theo cuộc trò chuyện.
 * @method GET
 * @route /api/messages/:conversation_id
 * @access Private
 */

messagesRoute.get(
  '/:conversation_id',
  paramsValidate(GetMultiMessageByConversationDtoSchema),
  queryValidate(QueryDtoSchema),
  asyncHandler(messagesController.getMultiByConversation)
)

export default messagesRoute
