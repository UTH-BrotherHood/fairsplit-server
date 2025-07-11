import { checkSchema, ParamSchema } from 'express-validator'
import { validate } from '~/utils/validation.utils'
import { ErrorWithStatus } from '~/utils/error.utils'
import { httpStatusCode } from '~/core/httpStatusCode'
import { verifyToken } from '~/utils/token.utils'
import { JsonWebTokenError } from 'jsonwebtoken'
import { AdminTokenPayload } from '~/models/requests/admin.requests'
import { ADMIN_MESSAGES } from '~/constants/messages'
import { envConfig } from '~/config/env'
import redisClient from '~/config/redis'
import databaseServices from '~/services/database.services'
import { TokenType } from '~/models/schemas/token.schema'

const emailSchema: ParamSchema = {
  notEmpty: {
    errorMessage: ADMIN_MESSAGES.EMAIL_REQUIRED
  },
  isEmail: {
    errorMessage: ADMIN_MESSAGES.EMAIL_INVALID
  },
  trim: true
}

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: ADMIN_MESSAGES.PASSWORD_REQUIRED
  },
  isString: {
    errorMessage: ADMIN_MESSAGES.PASSWORD_MUST_BE_STRING
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: ADMIN_MESSAGES.PASSWORD_LENGTH
  }
}

export const adminLoginValidation = validate(
  checkSchema({
    email: emailSchema,
    password: passwordSchema
  })
)

export const adminAccessTokenValidation = validate(
  checkSchema({
    authorization: {
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          if (!value) {
            throw new ErrorWithStatus({
              message: ADMIN_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
              status: httpStatusCode.UNAUTHORIZED
            })
          }
          const access_token = value.split(' ')[1]
          if (!access_token) {
            throw new ErrorWithStatus({
              message: ADMIN_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
              status: httpStatusCode.UNAUTHORIZED
            })
          }

          try {
            const decodedAuthorization = await verifyToken({
              token: access_token,
              secretOrPublickey: envConfig.jwtSecretAccessToken
            })
            const adminPayload = decodedAuthorization as AdminTokenPayload
            if (!adminPayload.role || !['admin', 'superAdmin', 'moderator'].includes(adminPayload.role)) {
              throw new ErrorWithStatus({
                message: ADMIN_MESSAGES.ADMIN_ACCESS_REQUIRED,
                status: httpStatusCode.FORBIDDEN
              })
            }
            req.decodedAuthorization = adminPayload
          } catch (error) {
            throw new ErrorWithStatus({
              message: (error as JsonWebTokenError).message,
              status: httpStatusCode.UNAUTHORIZED
            })
          }

          return true
        }
      }
    }
  })
)

export const systemSettingsValidation = validate(
  checkSchema({
    maxGroupsPerUser: {
      isInt: {
        options: { min: 1 },
        errorMessage: ADMIN_MESSAGES.MAX_GROUPS_INVALID
      }
    },
    defaultCurrency: {
      isString: {
        errorMessage: ADMIN_MESSAGES.CURRENCY_INVALID
      },
      isLength: {
        options: { min: 3, max: 3 },
        errorMessage: ADMIN_MESSAGES.CURRENCY_LENGTH
      }
    },
    'passwordPolicy.minLength': {
      isInt: {
        options: { min: 6 },
        errorMessage: ADMIN_MESSAGES.PASSWORD_MIN_LENGTH_INVALID
      }
    },
    'passwordPolicy.requireUppercase': {
      isBoolean: {
        errorMessage: ADMIN_MESSAGES.PASSWORD_POLICY_INVALID
      }
    },
    'passwordPolicy.requireNumber': {
      isBoolean: {
        errorMessage: ADMIN_MESSAGES.PASSWORD_POLICY_INVALID
      }
    },
    'notifications.enable': {
      isBoolean: {
        errorMessage: ADMIN_MESSAGES.NOTIFICATION_SETTINGS_INVALID
      }
    },
    'notifications.email': {
      isBoolean: {
        errorMessage: ADMIN_MESSAGES.NOTIFICATION_SETTINGS_INVALID
      }
    },
    'notifications.sms': {
      isBoolean: {
        errorMessage: ADMIN_MESSAGES.NOTIFICATION_SETTINGS_INVALID
      }
    }
  })
)

export const projectStatusValidation = validate(
  checkSchema({
    systemStatus: {
      isIn: {
        options: [['healthy', 'maintenance', 'degraded']],
        errorMessage: ADMIN_MESSAGES.SYSTEM_STATUS_INVALID
      }
    },
    message: {
      optional: true,
      isString: {
        errorMessage: ADMIN_MESSAGES.MESSAGE_MUST_BE_STRING
      },
      isLength: {
        options: { max: 500 },
        errorMessage: ADMIN_MESSAGES.MESSAGE_TOO_LONG
      }
    }
  })
)

export const notificationMarkReadValidation = validate(
  checkSchema({
    notificationId: {
      notEmpty: {
        errorMessage: ADMIN_MESSAGES.NOTIFICATION_ID_REQUIRED
      },
      isString: {
        errorMessage: ADMIN_MESSAGES.NOTIFICATION_ID_INVALID
      }
    }
  })
)

export const categoryValidation = validate(
  checkSchema({
    name: {
      notEmpty: {
        errorMessage: 'Category name is required'
      },
      isString: {
        errorMessage: 'Category name must be a string'
      },
      isLength: {
        options: { min: 1, max: 100 },
        errorMessage: 'Category name must be between 1 and 100 characters'
      }
    },
    description: {
      optional: true,
      isString: {
        errorMessage: 'Category description must be a string'
      },
      isLength: {
        options: { max: 500 },
        errorMessage: 'Category description must not exceed 500 characters'
      }
    }
  })
)

export const billStatusValidation = validate(
  checkSchema({
    status: {
      isIn: {
        options: [['pending', 'paid', 'overdue', 'cancelled']],
        errorMessage: 'Invalid bill status'
      }
    }
  })
)

export const adminRefreshTokenValidation = validate(
  checkSchema({
    refreshToken: {
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          if (!value) {
            throw new ErrorWithStatus({
              message: ADMIN_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
              status: httpStatusCode.UNAUTHORIZED
            })
          }

          try {
            // Check if token is blacklisted
            const redis = await redisClient
            const blacklistKey = `blacklist:token:${value}`
            const isBlacklisted = await redis.exists(blacklistKey)
            if (isBlacklisted) {
              throw new ErrorWithStatus({
                message: ADMIN_MESSAGES.INVALID_CREDENTIALS,
                status: httpStatusCode.UNAUTHORIZED
              })
            }

            const [decodedRefreshToken, refreshToken] = await Promise.all([
              verifyToken({ token: value, secretOrPublickey: envConfig.jwtSecretRefreshToken }),
              databaseServices.tokens.findOne({ token: value, type: TokenType.RefreshToken })
            ])

            if (!refreshToken) {
              throw new ErrorWithStatus({
                message: ADMIN_MESSAGES.INVALID_CREDENTIALS,
                status: httpStatusCode.UNAUTHORIZED
              })
            }

            const adminPayload = decodedRefreshToken as AdminTokenPayload
            if (!adminPayload.role || !['admin', 'superAdmin', 'moderator'].includes(adminPayload.role)) {
              throw new ErrorWithStatus({
                message: ADMIN_MESSAGES.ADMIN_ACCESS_REQUIRED,
                status: httpStatusCode.FORBIDDEN
              })
            }
            req.decodedRefreshToken = adminPayload
          } catch (error) {
            if (error instanceof JsonWebTokenError) {
              throw new ErrorWithStatus({
                message: error.message,
                status: httpStatusCode.UNAUTHORIZED
              })
            }
            throw error
          }
          return true
        }
      }
    }
  })
)

export const getAllUsersValidation = validate(
  checkSchema({
    page: {
      optional: true,
      isInt: {
        options: { min: 1 },
        errorMessage: 'Page must be a positive integer'
      }
    },
    limit: {
      optional: true,
      isInt: {
        options: { min: 1, max: 100 },
        errorMessage: 'Limit must be between 1 and 100'
      }
    },
    verify: {
      optional: true,
      isIn: {
        options: [['verify', 'verified', 'unverify', 'unverified']],
        errorMessage: 'Verify must be one of: verify, verified, unverify, unverified'
      }
    },
    search: {
      optional: true,
      isString: {
        errorMessage: 'Search must be a string'
      },
      isLength: {
        options: { max: 100 },
        errorMessage: 'Search query too long'
      }
    }
  })
)

export const bulkUpdateUserStatusValidation = validate(
  checkSchema(
    {
      userIds: {
        notEmpty: { errorMessage: 'User IDs are required' },
        isArray: { errorMessage: 'User IDs must be an array' },
        custom: {
          options: (value) => {
            if (!Array.isArray(value) || value.length === 0) throw new Error('User IDs array cannot be empty')
            if (value.length > 100) throw new Error('Cannot update more than 100 users at once')
            return true
          }
        }
      },
      'userIds.*': {
        isString: { errorMessage: 'Each user ID must be a string' },
        isMongoId: { errorMessage: 'Each user ID must be a valid MongoDB ObjectId' }
      },
      verify: {
        notEmpty: { errorMessage: 'Verify status is required' },
        isIn: {
          options: [['verified', 'unverified']],
          errorMessage: 'Verify must be either "verified" or "unverified"'
        }
      }
    },
    ['body']
  )
)

export const bulkDeleteUsersValidation = validate(
  checkSchema({
    userIds: {
      notEmpty: { errorMessage: 'User IDs are required' },
      isArray: { errorMessage: 'User IDs must be an array' },
      custom: {
        options: (value) => {
          if (!Array.isArray(value) || value.length === 0) throw new Error('User IDs array cannot be empty')
          if (value.length > 100) throw new Error('Cannot delete more than 100 users at once')
          return true
        }
      }
    },
    'userIds.*': {
      isString: { errorMessage: 'Each user ID must be a string' },
      isMongoId: { errorMessage: 'Each user ID must be a valid MongoDB ObjectId' }
    }
  })
)

export const bulkDeleteCategoriesValidation = validate(
  checkSchema({
    categoryIds: {
      notEmpty: { errorMessage: 'Category IDs are required' },
      isArray: { errorMessage: 'Category IDs must be an array' },
      custom: {
        options: (value) => {
          if (!Array.isArray(value) || value.length === 0) throw new Error('Category IDs array cannot be empty')
          if (value.length > 100) throw new Error('Cannot delete more than 100 categories at once')
          return true
        }
      }
    },
    'categoryIds.*': {
      isString: { errorMessage: 'Each category ID must be a string' },
      isMongoId: { errorMessage: 'Each category ID must be a valid MongoDB ObjectId' }
    }
  })
)

export const bulkDeleteBillsValidation = validate(
  checkSchema({
    billIds: {
      notEmpty: { errorMessage: 'Bill IDs are required' },
      isArray: { errorMessage: 'Bill IDs must be an array' },
      custom: {
        options: (value) => {
          if (!Array.isArray(value) || value.length === 0) throw new Error('Bill IDs array cannot be empty')
          if (value.length > 100) throw new Error('Cannot delete more than 100 bills at once')
          return true
        }
      }
    },
    'billIds.*': {
      isString: { errorMessage: 'Each bill ID must be a string' },
      isMongoId: { errorMessage: 'Each bill ID must be a valid MongoDB ObjectId' }
    }
  })
)
