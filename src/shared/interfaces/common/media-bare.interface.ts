import { IMedia } from '~/shared/interfaces/common/media.interface'

export type IMediaBare = Pick<IMedia, 's3_key' | 'url'>
