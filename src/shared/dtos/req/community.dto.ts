import { z } from 'zod'
import { CONSTANT_REGEX } from '~/shared/constants'
import { EMembershipType, EVisibilityType } from '~/shared/enums/type.enum'
import { ICommunity } from '~/shared/interfaces/schemas/community.interface'

export const CreateCommunityDtoSchema = z.object({
  name: z.string().trim().max(32),
  cover: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(200).optional(),
  category: z.string().trim().max(16),
  visibilityType: z.nativeEnum(EVisibilityType),
  membershipType: z.nativeEnum(EMembershipType),
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
  showLogForMember: z.boolean().optional(),
  showLogForMentor: z.boolean().optional(),
  showInviteListForMember: z.boolean().optional(),
  showInviteListForMentor: z.boolean().optional(),
  inviteExpireDays: z.number().optional(),
  membershipType: z.nativeEnum(EMembershipType).optional(),
  visibilityType: z.nativeEnum(EVisibilityType).optional()
})

export type CreateCommunityDto = z.infer<typeof CreateCommunityDtoSchema>
export type InvitationMembersDto = z.infer<typeof InvitationMembersDtoSchema>
export type JoinLeaveCommunityDto = z.infer<typeof JoinLeaveCommunityDtoSchema>
export type PromoteMentorDto = z.infer<typeof PromoteMentorDtoSchema>
export type DemoteMentorDto = z.infer<typeof DemoteMentorDtoSchema>
export type GetOneBySlugDto = z.infer<typeof GetOneBySlugDtoSchema>
export type GetMMByIdDto = z.infer<typeof GetMMByIdDtoSchema>
export type PinCommunityDto = z.infer<typeof PinCommunityDtoSchema>
export type GetMultiInvitationsDto = z.infer<typeof GetMultiInvitationsDtoSchema>
export type UpdateDto = z.infer<typeof UpdateDtoSchema>
export type deleteInvitationDto = z.infer<typeof deleteInvitationDtoSchema>

//
export type CreateCommunityActivityDto = {
  action: string
  actor_id: string
  community_id: string
}
export type CreateCommunityInvitationDto = {
  user_id: string
  community: ICommunity
  member_ids: string[]
}
