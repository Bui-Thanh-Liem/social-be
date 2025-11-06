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
import { wrapAsyncHandler } from '~/utils/wrap-async-handler.util'

const conversationsRoute = Router()

conversationsRoute.post(
  '/',
  verifyAccessToken,
  verifyUserEmail,
  requestBodyValidate(CreateConversationDtoSchema),
  checkExistParticipants,
  wrapAsyncHandler(ConversationsController.create)
)

conversationsRoute.post(
  '/add-participants/:conv_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(ConversationIdDtoSchema),
  requestBodyValidate(ParticipantsDtoSchema),
  checkExistParticipants,
  wrapAsyncHandler(ConversationsController.addParticipants)
)

conversationsRoute.post(
  '/remove-participants/:conv_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(ConversationIdDtoSchema),
  requestBodyValidate(ParticipantsDtoSchema),
  checkExistParticipants,
  wrapAsyncHandler(ConversationsController.removeParticipants)
)

conversationsRoute.post(
  '/promote/:conv_id',
  verifyAccessToken,
  verifyUserEmail,
  requestParamsValidate(ConversationIdDtoSchema),
  requestBodyValidate(ParticipantsDtoSchema),
  checkExistParticipants,
  wrapAsyncHandler(ConversationsController.promoteMentor)
)

conversationsRoute.get(
  '/',
  verifyAccessToken,
  verifyUserEmail,
  requestQueryValidate(QueryDtoSchema),
  wrapAsyncHandler(ConversationsController.getMulti)
)

conversationsRoute.patch(
  '/read/:conv_id',
  verifyAccessToken,
  requestParamsValidate(ConversationIdDtoSchema),
  wrapAsyncHandler(ConversationsController.read)
)

conversationsRoute.patch(
  '/toggle-pin/:conv_id',
  verifyAccessToken,
  requestParamsValidate(ConversationIdDtoSchema),
  wrapAsyncHandler(ConversationsController.togglePinConv)
)

conversationsRoute.delete(
  '/:conv_id',
  verifyAccessToken,
  requestParamsValidate(ConversationIdDtoSchema),
  wrapAsyncHandler(ConversationsController.delete)
)

export default conversationsRoute
