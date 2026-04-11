import { IMedia } from '~/interfaces/public/media.interface'

export type IMediaBare = Pick<IMedia, 's3_key' | 'url'>
