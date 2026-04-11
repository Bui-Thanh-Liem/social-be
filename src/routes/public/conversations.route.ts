import { Router } from 'express'
import conversationsController from '~/controllers/public/conversations.controller'
import { CreateConversationDtoSchema, ParticipantsDtoSchema } from '~/dtos/public/conversations.dto'
import { authenticationUserMiddleware } from '~/middlewares/authentication-user.middleware'
import { bodyValidate } from '~/middlewares/body-validate.middleware'
import { checkExistParticipantsMiddleware } from '~/middlewares/community/check-exist-participants.middleware'
import { paramsValidate } from '~/middlewares/params-validate.middleware'
import { queryValidate } from '~/middlewares/query-validate.middleware'
import { ParamIdDtoSchema } from '~/shared/dtos/common/param-id.dto'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

/**
 * @module ConversationsRoutes
 * @description Quản lý các API liên quan đến cuộc trò chuyện (conversations), bao gồm tạo cuộc trò chuyện mới, thêm/xóa thành viên, promote mentor, lấy danh sách cuộc trò chuyện của người dùng, đánh dấu đã đọc, ghim cuộc trò chuyện và xóa cuộc trò chuyện.
 */

const conversationsRoute = Router()

/**
 * @description Middleware xác thực để bảo vệ các route tiếp theo, chỉ cho phép truy cập nếu người dùng đã đăng nhập.
 */
conversationsRoute.use(authenticationUserMiddleware)

/**
 * @description API để tạo một cuộc trò chuyện mới giữa người dùng và một hoặc nhiều người tham gia khác. Người dùng có thể tạo cuộc trò chuyện với bạn bè, nhóm hoặc mentor.
 * @method POST
 * @route /api/conversations
 * @access Private
 */
conversationsRoute.post(
  '/',
  bodyValidate(CreateConversationDtoSchema),
  checkExistParticipantsMiddleware,
  asyncHandler(conversationsController.create)
)

/**
 * @description API để thêm thành viên vào cuộc trò chuyện.
 * @method POST
 * @route /api/conversations/add-participants/:id
 * @access Private
 */
conversationsRoute.post(
  '/add-participants/:id',
  paramsValidate(ParamIdDtoSchema),
  bodyValidate(ParticipantsDtoSchema),
  checkExistParticipantsMiddleware,
  asyncHandler(conversationsController.addParticipants)
)

/**
 * @description API để xóa thành viên khỏi cuộc trò chuyện.
 * @method POST
 * @route /api/conversations/remove-participants/:id
 * @access Private
 */
conversationsRoute.post(
  '/remove-participants/:id',
  paramsValidate(ParamIdDtoSchema),
  bodyValidate(ParticipantsDtoSchema),
  checkExistParticipantsMiddleware,
  asyncHandler(conversationsController.removeParticipants)
)

/**
 * @description API để promote một thành viên thành mentor trong cuộc trò chuyện.
 * @method POST
 * @route /api/conversations/promote/:id
 * @access Private
 */
conversationsRoute.post(
  '/promote/:id',
  paramsValidate(ParamIdDtoSchema),
  bodyValidate(ParticipantsDtoSchema),
  checkExistParticipantsMiddleware,
  asyncHandler(conversationsController.promoteMentor)
)

/**
 * @description API để lấy danh sách các cuộc trò chuyện mà người dùng tham gia, bao gồm thông tin về người tham gia, tin nhắn cuối cùng và trạng thái đã đọc.
 * @method GET
 * @route /api/conversations
 * @access Private
 */
conversationsRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(conversationsController.getMulti))

/**
 * @description API để đánh dấu một cuộc trò chuyện đã đọc.
 * @method PATCH
 * @route /api/conversations/read/:id
 * @access Private
 */
conversationsRoute.patch('/read/:id', paramsValidate(ParamIdDtoSchema), asyncHandler(conversationsController.read))

/**
 * @description API để ghim hoặc bỏ ghim một cuộc trò chuyện.
 * @method PATCH
 * @route /api/conversations/toggle-pin/:id
 * @access Private
 */
conversationsRoute.patch(
  '/toggle-pin/:id',
  paramsValidate(ParamIdDtoSchema),
  asyncHandler(conversationsController.togglePinConv)
)

/**
 * @description API để xóa một cuộc trò chuyện.
 * @method DELETE
 * @route /api/conversations/:id
 * @access Private
 */
conversationsRoute.delete('/:id', paramsValidate(ParamIdDtoSchema), asyncHandler(conversationsController.delete))

export default conversationsRoute
