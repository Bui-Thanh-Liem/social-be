import { z } from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'
import { ETweetStatus } from '~/shared/enums/status.enum'
import { EMembershipType, EVisibilityType } from '~/shared/enums/type.enum'
import { IActionActivity, ICommunity } from '~/shared/interfaces/schemas/community.interface'

export const CreateCommunityDtoSchema = z.object({
  name: z.string().trim().max(32),
  cover: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(200).optional(),
  category: z.string().trim().max(16),
  visibility_type: z.nativeEnum(EVisibilityType),
  membership_type: z.nativeEnum(EMembershipType),
  member_ids: z
    .array(
      z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
        message: 'ObjectId không hợp lệ'
      })
    )
    .optional()
})

export const InvitationMembersDtoSchema = z.object({
  member_ids: z
    .array(
      z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
        message: 'ObjectId không hợp lệ'
      })
    )
    .min(1, { message: 'Vui lòng chọn ít nhất một người dùng.' }),
  community_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  })
})

export const JoinLeaveCommunityDtoSchema = z.object({
  community_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  })
})

export const PinCommunityDtoSchema = z.object({
  community_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  })
})

export const GetOneBySlugDtoSchema = z.object({
  slug: z.string().trim()
})

export const GetMMByIdDtoSchema = z.object({
  community_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  })
})

export const PromoteMentorDtoSchema = z.object({
  user_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  }),
  community_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  })
})

export const DemoteMentorDtoSchema = PromoteMentorDtoSchema

export const GetMultiInvitationsDtoSchema = GetMMByIdDtoSchema
export const GetMultiActivityDtoSchema = GetMMByIdDtoSchema
export const deleteInvitationDtoSchema = z.object({
  invitation_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  }),
  community_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  })
})

export const UpdateDtoSchema = z.object({
  community_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  }),
  show_log_for_member: z.boolean().optional(),
  show_log_for_mentor: z.boolean().optional(),
  show_invite_list_for_member: z.boolean().optional(),
  show_invite_list_for_mentor: z.boolean().optional(),
  invite_expire_days: z.number().optional(),
  membership_type: z.nativeEnum(EMembershipType).optional(),
  visibility_type: z.nativeEnum(EVisibilityType).optional()
})

export const ChangeStatusTweetInCommunityDtoSchema = z.object({
  community_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  }),
  tweet_id: z.string().trim().regex(CONSTANT_REGEX.ID_MONGO, {
    message: 'ObjectId không hợp lệ'
  }),
  status: z.nativeEnum(ETweetStatus)
})

export type CreateCommunityDto = z.infer<typeof CreateCommunityDtoSchema>
export type InvitationMembersDto = z.infer<typeof InvitationMembersDtoSchema>
export type JoinLeaveCommunityDto = z.infer<typeof JoinLeaveCommunityDtoSchema>
export type PromoteMentorDto = z.infer<typeof PromoteMentorDtoSchema>
export type DemoteMentorDto = z.infer<typeof DemoteMentorDtoSchema>
export type GetOneBySlugDto = z.infer<typeof GetOneBySlugDtoSchema>
export type GetMMByIdDto = z.infer<typeof GetMMByIdDtoSchema>
export type GetMultiActivityDto = z.infer<typeof GetMMByIdDtoSchema>
export type PinCommunityDto = z.infer<typeof PinCommunityDtoSchema>
export type GetMultiInvitationsDto = z.infer<typeof GetMultiInvitationsDtoSchema>
export type UpdateDto = z.infer<typeof UpdateDtoSchema>
export type deleteInvitationDto = z.infer<typeof deleteInvitationDtoSchema>
export type ChangeStatusTweetInCommunityDto = z.infer<typeof ChangeStatusTweetInCommunityDtoSchema>

//
export type CreateCommunityActivityDto = {
  action: IActionActivity
  actor_id: string
  community_id: string
}
export type CreateCommunityInvitationDto = {
  user_id: string
  community: ICommunity
  member_ids: string[]
}
