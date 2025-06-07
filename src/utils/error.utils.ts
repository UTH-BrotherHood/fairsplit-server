import { USER_MESSAGES } from '~/constants/messages'
import { httpStatusCode } from '~/core/httpStatusCode'

interface ErrorBodyType {
  message: string
  status: number
}

// Định nghĩa interface cho error response
export interface ErrorResponse {
  error: {
    message: string
    status: number
    code?: string
    details?: Record<string, any>
  }
}

// Định nghĩa interface cho validation errors
export interface ValidationError {
  msg: string
  param?: string
  location?: string
  value?: any
}

type ErrorsType = Record<
  string,
  {
    msg: string
    [key: string]: any
  }
>

export class ErrorWithStatus {
  message: string
  status: number
  code?: string

  constructor({ message, status, code }: ErrorBodyType & { code?: string }) {
    this.message = message
    this.status = status
    this.code = code
  }
}

export class EntityError extends ErrorWithStatus {
  errors: ErrorsType

  constructor({
    message = USER_MESSAGES.VALIDATION_ERROR,
    errors,
    code = 'VALIDATION_ERROR'
  }: {
    message?: string
    errors: ErrorsType
    code?: string
  }) {
    super({ message, status: httpStatusCode.UNPROCESSABLE_ENTITY, code })
    this.errors = errors
  }
}
