import { ErrorRequestHandler } from 'express'
import { omit } from 'lodash'
import httpStatusCode from '~/core/statusCodes'
import { logger } from '~/loggers/my-logger.log'
import { ErrorWithStatus, EntityError, ErrorResponse, ValidationError } from '~/utils/error.utils'

// Định nghĩa rõ kiểu là ErrorRequestHandler
export const defaultErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Chuẩn bị thông tin request để log
  const requestInfo = {
    method: req.method,
    originalUrl: req.originalUrl,
    params: req.params,
    body: omit(req.body, ['password', 'confirmPassword']), // Loại bỏ các field nhạy cảm
    query: req.query,
    userIP: req.ip || req.socket.remoteAddress,
    userId: (req as any).decodedAuthorization?.userId || 'NOT_AUTHENTICATED'
  }

  // Chuẩn bị response error mặc định
  const errorResponse: ErrorResponse = {
    error: {
      message: 'Internal Server Error',
      status: httpStatusCode.INTERNAL_SERVER_ERROR
    }
  }

  // Log error details
  logger.error(
    err.message,
    'ErrorHandler',
    Array.isArray(req.headers['x-request-id'])
      ? req.headers['x-request-id'][0]
      : req.headers['x-request-id'] || 'NO_REQUEST_ID',
    {
      errorName: err.name,
      errorStack: err.stack,
      status: err instanceof ErrorWithStatus ? err.status : httpStatusCode.INTERNAL_SERVER_ERROR,
      requestInfo
    }
  )

  // Set response headers
  res.setHeader('Content-Type', 'application/json')

  // Xử lý các loại error khác nhau
  if (err instanceof ErrorWithStatus) {
    errorResponse.error = {
      message: err.message,
      status: err.status,
      code: err.code
    }

    if (err instanceof EntityError) {
      const validationErrors: Record<string, ValidationError> = {}

      Object.keys(err.errors).forEach((key) => {
        validationErrors[key] = {
          msg: err.errors[key].msg,
          param: key,
          location: 'body',
          value: err.errors[key].value
        }
      })

      errorResponse.error.details = validationErrors
    }

    res.status(err.status).json(errorResponse)
    return
  }

  // Xử lý unknown errors
  if (process.env.NODE_ENV === 'development') {
    // Make error properties enumerable for proper JSON serialization
    Object.getOwnPropertyNames(err).forEach((key) => {
      Object.defineProperty(err, key, { enumerable: true })
    })

    errorResponse.error.details = omit(err, ['stack'])
  }

  res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json(errorResponse)
}
