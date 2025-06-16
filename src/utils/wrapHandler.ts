import { Request, Response, NextFunction, RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { logger } from '~/loggers/my-logger.log'

// Sử dụng RequestHandler từ express
export const wrapRequestHandler = <P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = any>(
  fn: (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => Promise<any> | any
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      logger.error('Error caught in wrapRequestHandler:', err)
      next(err)
    })
  }
}
