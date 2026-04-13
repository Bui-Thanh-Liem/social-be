import { IJwtPayload } from '~/shared/interfaces/common/jwt.interface'
import { Request, Response } from 'express'
import reelsService from '~/services/public/reels.service'
import { CreatedResponse } from '~/core/success.response'

class ReelsController {
  async create(req: Request, res: Response) {
    const { user_id } = req?.decoded_authorization as IJwtPayload
    const reel = await reelsService.create(user_id!, req.body)
    res.json(new CreatedResponse('Tạo tin thành công', reel))
  }

  async changeStatusReel(req: Request, res: Response) {
    const { user_id } = req?.decoded_authorization as IJwtPayload
    const reel = await reelsService.changeStatusReel({
      user_id: user_id!,
      reel_id: req.params.reel_id,
      status: req.body.status
    })
    res.json(new CreatedResponse('Thay đổi trạng thái reel thành công', reel))
  }

  async getNewFeed(req: Request, res: Response) {
    const user = req?.decoded_authorization as IJwtPayload
    const reels = await reelsService.getNewFeed({
      query: req.query,
      user_active_id: user?.user_id
    })
    res.json(new CreatedResponse('Lấy danh sách reels thành công', reels))
  }

  async getProfileReels(req: Request, res: Response) {
    const user = req?.decoded_authorization as IJwtPayload
    const reels = await reelsService.getProfileReels({
      query: req.query,
      user_id: req.params.id,
      user_active_id: user?.user_id
    })

    res.json(new CreatedResponse('Lấy danh sách reels của profile thành công', reels))
  }

  async delete(req: Request, res: Response) {
    const { user_id } = req?.decoded_authorization as IJwtPayload
    const reel = await reelsService.delete(user_id!, req.params.id)
    res.json(new CreatedResponse('Xóa reel thành công', reel))
  }
}

export default new ReelsController()
