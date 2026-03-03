import { IMedia } from '~/modules/media/media.interface'

export type IMediaBare = Pick<IMedia, 's3_key' | 'url'>
