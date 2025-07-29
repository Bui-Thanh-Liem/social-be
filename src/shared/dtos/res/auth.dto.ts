import { IUser } from '~/shared/interfaces/schemas/user.interface'

export type ResRegisterUser = Pick<IUser, 'email'>
export type ResLoginUser = { access_token: string; refresh_token: string }
