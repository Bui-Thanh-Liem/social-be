import { Router } from 'express'
import ConversationsController from '~/modules/conversations/conversations.controller'
import { QueryDtoSchema } from '~/shared/dtos/common/query.dto'
import { bodyValidate } from '~/utils/body-validate.middleware'
import { checkExistParticipantsMiddleware } from '~/shared/middlewares/community/check-exist-participants.middleware'
import { paramsValidate } from '~/utils/params-validate.middleware'
import { queryValidate } from '~/utils/query-validate.middleware'
import { authenticationMiddleware } from '~/shared/middlewares/user/authentication.middleware'
import { verifyUserEmailMiddleware } from '~/shared/middlewares/user/verify-user-email.middleware'
import { asyncHandler } from '~/utils/async-handler.util'
import { ConversationIdDtoSchema, CreateConversationDtoSchema, ParticipantsDtoSchema } from './conversations.dto'

const conversationsRoute = Router()

conversationsRoute.use(authenticationMiddleware, verifyUserEmailMiddleware)

conversationsRoute.post(
  '/',
  bodyValidate(CreateConversationDtoSchema),
  checkExistParticipantsMiddleware,
  asyncHandler(ConversationsController.create)
)

conversationsRoute.post(
  '/add-participants/:conv_id',
  paramsValidate(ConversationIdDtoSchema),
  bodyValidate(ParticipantsDtoSchema),
  checkExistParticipantsMiddleware,
  asyncHandler(ConversationsController.addParticipants)
)

conversationsRoute.post(
  '/remove-participants/:conv_id',
  paramsValidate(ConversationIdDtoSchema),
  bodyValidate(ParticipantsDtoSchema),
  checkExistParticipantsMiddleware,
  asyncHandler(ConversationsController.removeParticipants)
)

conversationsRoute.post(
  '/promote/:conv_id',
  paramsValidate(ConversationIdDtoSchema),
  bodyValidate(ParticipantsDtoSchema),
  checkExistParticipantsMiddleware,
  asyncHandler(ConversationsController.promoteMentor)
)

conversationsRoute.get('/', queryValidate(QueryDtoSchema), asyncHandler(ConversationsController.getMulti))

conversationsRoute.patch(
  '/read/:conv_id',
  paramsValidate(ConversationIdDtoSchema),
  asyncHandler(ConversationsController.read)
)

conversationsRoute.patch(
  '/toggle-pin/:conv_id',
  paramsValidate(ConversationIdDtoSchema),
  asyncHandler(ConversationsController.togglePinConv)
)

conversationsRoute.delete(
  '/:conv_id',
  paramsValidate(ConversationIdDtoSchema),
  asyncHandler(ConversationsController.delete)
)

export default conversationsRoute
