import { Router } from 'express'
import ConversationsController from '~/controllers/Conversations.controller'
import { checkExistParticipants } from '~/middlewares/checkExistParticipants.middleware'
import { requestBodyValidate } from '~/middlewares/requestBodyValidate.middleware'
import { requestParamsValidate } from '~/middlewares/requestParamsValidate.middleware'
import { requestQueryValidate } from '~/middlewares/requestQueryValidate.middleware'
import { verifyAccessToken } from '~/middlewares/verifyAccessToken.middleware'
import { verifyUserEmail } from '~/middlewares/verifyUserEmail.middleware'
import {
  ConversationIdDtoSchema,
  CreateConversationDtoSchema,
  ParticipantsDtoSchema
} from '~/shared/dtos/req/conversation.dto'
import { QueryDtoSchema } from '~/shared/dtos/req/query.dto'
import { wrapAsyncHandler } from '~/utils/wrapAsyncHandler.util'

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
  '/promote-mentor/:conv_id',
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
