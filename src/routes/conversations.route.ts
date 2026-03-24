import { Router } from 'express'
import conversationsController from '~/controllers/conversations.controller'
import { ConversationIdDtoSchema, CreateConversationDtoSchema, ParticipantsDtoSchema } from '~/dtos/conversations.dto'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { bodyValidate } from '~/middlewares/body-validate.middleware'
import { checkExistParticipantsMiddleware } from '~/middlewares/community/check-exist-participants.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const conversationsRoute = Router()

// Các route dưới đây cần authentication
conversationsRoute.use(authenticationMiddleware)

// Tạo conversation mới
conversationsRoute.post(
  '/',
  bodyValidate(CreateConversationDtoSchema),
  checkExistParticipantsMiddleware,
  asyncHandler(conversationsController.create)
)

// Thêm, xóa thành viên và promote mentor trong conversation
conversationsRoute.post(
  '/add-participants/:conv_id',
  paramsValidate(ConversationIdDtoSchema),
  bodyValidate(ParticipantsDtoSchema),
  checkExistParticipantsMiddleware,
  asyncHandler(conversationsController.addParticipants)
)

// Xóa thành viên khỏi conversation
conversationsRoute.post(
  '/remove-participants/:conv_id',
  paramsValidate(ConversationIdDtoSchema),
  bodyValidate(ParticipantsDtoSchema),
  checkExistParticipantsMiddleware,
  asyncHandler(conversationsController.removeParticipants)
)

// Promote mentor trong conversation
conversationsRoute.post(
  '/promote/:conv_id',
  paramsValidate(ConversationIdDtoSchema),
  bodyValidate(ParticipantsDtoSchema),
  checkExistParticipantsMiddleware,
  asyncHandler(conversationsController.promoteMentor)
)

// Lấy danh sách conversation của user
conversationsRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(conversationsController.getMulti))

// Đánh dấu đã đọc conversation
conversationsRoute.patch(
  '/read/:conv_id',
  paramsValidate(ConversationIdDtoSchema),
  asyncHandler(conversationsController.read)
)

// Ghim, bỏ ghim conversation
conversationsRoute.patch(
  '/toggle-pin/:conv_id',
  paramsValidate(ConversationIdDtoSchema),
  asyncHandler(conversationsController.togglePinConv)
)

// Xóa conversation
conversationsRoute.delete(
  '/:conv_id',
  paramsValidate(ConversationIdDtoSchema),
  asyncHandler(conversationsController.delete)
)

export default conversationsRoute
