import { Router } from 'express'
import ConversationsController from '~/controllers/Conversations.controller'
import { checkExistParticipants } from '~/middlewares/check-exist-participants.middleware'
import { requestBodyValidate } from '~/middlewares/request-body-validate.middleware'
import { requestParamsValidate } from '~/middlewares/request-params-validate.middleware'
import { requestQueryValidate } from '~/middlewares/request-query-validate.middleware'
import { verifyAccessToken } from '~/middlewares/verify-access-token.middleware'
import { verifyUserEmail } from '~/middlewares/verify-user-email.middleware'
import {
  ConversationIdDtoSchema,
  CreateConversationDtoSchema,
  ParticipantsDtoSchema
} from '~/shared/dtos/req/conversation.dto'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { asyncHandler } from '~/utils/async-handler.util'

const conversationsRoute = Router()

conversationsRoute.use(verifyAccessToken, verifyUserEmail)

conversationsRoute.post(
  '/',
  requestBodyValidate(CreateConversationDtoSchema),
  checkExistParticipants,
  asyncHandler(ConversationsController.create)
)

conversationsRoute.post(
  '/add-participants/:conv_id',
  requestParamsValidate(ConversationIdDtoSchema),
  requestBodyValidate(ParticipantsDtoSchema),
  checkExistParticipants,
  asyncHandler(ConversationsController.addParticipants)
)

conversationsRoute.post(
  '/remove-participants/:conv_id',
  requestParamsValidate(ConversationIdDtoSchema),
  requestBodyValidate(ParticipantsDtoSchema),
  checkExistParticipants,
  asyncHandler(ConversationsController.removeParticipants)
)

conversationsRoute.post(
  '/promote/:conv_id',
  requestParamsValidate(ConversationIdDtoSchema),
  requestBodyValidate(ParticipantsDtoSchema),
  checkExistParticipants,
  asyncHandler(ConversationsController.promoteMentor)
)

conversationsRoute.get('/', requestQueryValidate(QueryDtoSchema), asyncHandler(ConversationsController.getMulti))

conversationsRoute.patch(
  '/read/:conv_id',
  verifyAccessToken,
  requestParamsValidate(ConversationIdDtoSchema),
  asyncHandler(ConversationsController.read)
)

conversationsRoute.patch(
  '/toggle-pin/:conv_id',
  requestParamsValidate(ConversationIdDtoSchema),
  asyncHandler(ConversationsController.togglePinConv)
)

conversationsRoute.delete(
  '/:conv_id',
  requestParamsValidate(ConversationIdDtoSchema),
  asyncHandler(ConversationsController.delete)
)

export default conversationsRoute
