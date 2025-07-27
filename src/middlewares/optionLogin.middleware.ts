import { NextFunction, Request, Response } from 'express'

// Middleware này cho phép có hoặc không đăng nhập vẫn cho qua
// Có đăng nhập qua thì có dữ liệu
export const optionLogin =
  (middleware: (req: Request, res: Response, next: NextFunction) => void) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.headers['authorization']) {
        middleware(req, res, next)
      } else {
        next()
      }
    } catch (error) {
      console.log(error)
      next(error)
    }
  }
