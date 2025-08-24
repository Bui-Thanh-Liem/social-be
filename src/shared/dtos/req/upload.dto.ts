import { z } from 'zod'

export const remoteImagesDtoSchema = z.object({
  urls: z.array(z.string().trim()).nonempty()
})

export type RemoteImagesDto = z.infer<typeof remoteImagesDtoSchema>
