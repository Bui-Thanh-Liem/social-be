import { z } from 'zod'
import { EMediaType } from '~/shared/enums/type.enum'

export const signedDtoSchema = z.object({
  public_data_signed: z
    .array(
      z.object({
        public_id: z.string().trim(),
        resource_type: z.nativeEnum(EMediaType).default(EMediaType.Image)
      })
    )
    .nonempty()
})

export type SignedDto = z.infer<typeof signedDtoSchema>
