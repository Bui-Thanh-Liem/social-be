import { Router } from 'express'
import ConversationsController from '~/modules/conversations/conversations.controller'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { bodyValidate } from '~/utils/body-validate.middleware'
import { checkExistParticipantsMiddleware } from '~/middlewares/community/check-exist-participants.middleware'
import { paramsValidate } from '~/utils/params-validate.middleware'
import { queryValidate } from '~/utils/query-validate.middleware'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import { ConversationIdDtoSchema, CreateConversationDtoSchema, ParticipantsDtoSchema } from './conversations.dto'

const conversationsRoute = Router()

// Các route dưới đây cần authentication
conversationsRoute.use(authenticationMiddleware)

// Tạo conversation mới
conversationsRoute.post(
  '/',
  bodyValidate(CreateConversationDtoSchema),
  checkExistParticipantsMiddleware,
  asyncHandler(ConversationsController.create)
)

// Thêm, xóa thành viên và promote mentor trong conversation
conversationsRoute.post(
  '/add-participants/:conv_id',
  paramsValidate(ConversationIdDtoSchema),
  bodyValidate(ParticipantsDtoSchema),
  checkExistParticipantsMiddleware,
  asyncHandler(ConversationsController.addParticipants)
)

// Xóa thành viên khỏi conversation
conversationsRoute.post(
  '/remove-participants/:conv_id',
  paramsValidate(ConversationIdDtoSchema),
  bodyValidate(ParticipantsDtoSchema),
  checkExistParticipantsMiddleware,
  asyncHandler(ConversationsController.removeParticipants)
)

// Promote mentor trong conversation
conversationsRoute.post(
  '/promote/:conv_id',
  paramsValidate(ConversationIdDtoSchema),
  bodyValidate(ParticipantsDtoSchema),
  checkExistParticipantsMiddleware,
  asyncHandler(ConversationsController.promoteMentor)
)

// Lấy danh sách conversation của user
conversationsRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(ConversationsController.getMulti))

// Đánh dấu đã đọc conversation
conversationsRoute.patch(
  '/read/:conv_id',
  paramsValidate(ConversationIdDtoSchema),
  asyncHandler(ConversationsController.read)
)

// Ghim, bỏ ghim conversation
conversationsRoute.patch(
  '/toggle-pin/:conv_id',
  paramsValidate(ConversationIdDtoSchema),
  asyncHandler(ConversationsController.togglePinConv)
)

// Xóa conversation
conversationsRoute.delete(
  '/:conv_id',
  paramsValidate(ConversationIdDtoSchema),
  asyncHandler(ConversationsController.delete)
)

export default conversationsRoute
