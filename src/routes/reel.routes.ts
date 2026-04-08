import { Router } from 'express'
import { authenticationMiddleware } from '~/middlewares/authentication.middleware'
import { bodyValidate } from '~/middlewares/body-validate.middleware'

const reelRoute = Router()

// Các route dưới đây có thể có hoặc không có authentication
reelRoute.use(authenticationMiddleware)

// Tạo reel mới
reelRoute.route('/').post(bodyValidate)

export default reelRoute
