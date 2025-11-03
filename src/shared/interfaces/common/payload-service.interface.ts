import { IVideo } from '../schemas/video.interface'

export type IPayloadCreateVideo = Pick<IVideo, 'name' | 'size' | 'user_id'>
