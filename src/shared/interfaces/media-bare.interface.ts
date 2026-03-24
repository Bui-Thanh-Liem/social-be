import { IMedia } from '~/interfaces/media.interface'

export type IMediaBare = Pick<IMedia, 's3_key' | 'url'>
