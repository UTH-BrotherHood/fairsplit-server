import { AUTH_MESSAGES, USER_MESSAGES } from '~/constants/messages'
import { checkSchema, ParamSchema } from 'express-validator'
import { validate } from '~/utils/validation.utils'
import { ErrorWithStatus } from '~/utils/error.utils'
import httpStatusCode from '~/core/statusCodes'
import { verifyToken } from '~/utils/token.utils'
import { JsonWebTokenError } from 'jsonwebtoken'
import databaseServices from '~/services/database.services'
import { UserVerificationType } from '~/models/schemas/user.schema'
import { TokenPayload } from '~/models/requests/user.requests'
import { TokenType } from '~/models/schemas/token.schema'
import redisClient from '~/config/redis'
import envConfig from '~/config/env'

const usernameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: AUTH_MESSAGES.NAME_REQUIRED
  },
  isString: {
    errorMessage: AUTH_MESSAGES.NAME_MUST_BE_STRING
  },
  isLength: {
    options: {
      min: 3,
      max: 50
    },
    errorMessage: AUTH_MESSAGES.NAME_LENGTH
  },
  trim: true,
  matches: {
    options: /^[a-zA-Z0-9_-]+$/,
    errorMessage: AUTH_MESSAGES.USERNAME_INVALID
  }
}

const dateOfBirthSchema: ParamSchema = {
  notEmpty: {
    errorMessage: 'Date of birth is required'
  },
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'
  },
  custom: {
    options: async (value: string) => {
      const dateValue = new Date(value)
      const today = new Date()
      let age = today.getFullYear() - dateValue.getFullYear()
      const monthDiff = today.getMonth() - dateValue.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateValue.getDate())) {
        age--
      }

      // if (age < 13) {
      //   throw new ErrorWithStatus({
      //     message: 'You must be at least 13 years old',
      //     status: httpStatusCode.BAD_REQUEST
      //   })
      // }

      if (age > 120) {
        throw new ErrorWithStatus({
          message: 'Invalid date of birth: Age cannot be more than 120 years',
          status: httpStatusCode.BAD_REQUEST
        })
      }

      return true
    }
  }
}

const avatarUrlSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: 'Avatar URL must be a string'
  },
  isLength: {
    options: {
      min: 0,
      max: 2000
    },
    errorMessage: 'Avatar URL length must be between 0 and 2000 characters'
  },
  trim: true,
  matches: {
    options: /^https?:\/\//,
    errorMessage: 'Avatar URL must be a valid HTTP/HTTPS URL'
  }
}

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: USER_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRONG
  }
}

const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    },
    errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
      }
      return true
    }
  }
}

const emailSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value, { req }) => {
      if (!value && !req.body.phone) {
        throw new Error(USER_MESSAGES.EMAIL_OR_PHONE_IS_REQUIRED)
      }
      if (value) {
        if (typeof value !== 'string') {
          throw new Error(USER_MESSAGES.EMAIL_MUST_BE_A_STRING)
        }
        if (!value.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
          throw new Error(USER_MESSAGES.EMAIL_IS_INVALID)
        }
        const user = await databaseServices.users.findOne({ email: value })
        if (user) {
          throw new Error(USER_MESSAGES.EMAIL_ALREADY_EXISTS)
        }
      }
      return true
    }
  }
}

const phoneSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value, { req }) => {
      if (!value && !req.body.email) {
        throw new Error(USER_MESSAGES.EMAIL_OR_PHONE_IS_REQUIRED)
      }
      if (value) {
        if (typeof value !== 'string') {
          throw new Error(USER_MESSAGES.PHONE_MUST_BE_A_STRING)
        }
        if (!value.match(/^\+?[1-9]\d{1,14}$/)) {
          throw new Error(USER_MESSAGES.PHONE_IS_INVALID)
        }
        const user = await databaseServices.users.findOne({ phone: value })
        if (user) {
          throw new Error(USER_MESSAGES.PHONE_ALREADY_EXISTS)
        }
      }
      return true
    }
  }
}

export const registerValidation = validate(
  checkSchema({
    username: usernameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
    verificationType: {
      notEmpty: {
        errorMessage: USER_MESSAGES.VERIFICATION_TYPE_IS_REQUIRED
      },
      isString: {
        errorMessage: USER_MESSAGES.VERIFICATION_TYPE_MUST_BE_A_STRING
      },
      isIn: {
        options: [Object.values(UserVerificationType)],
        errorMessage: USER_MESSAGES.VERIFICATION_TYPE_IS_INVALID
      }
    },
    dateOfBirth: dateOfBirthSchema,
    avatarUrl: avatarUrlSchema
  })
)

export const loginValidation = validate(
  checkSchema({
    email: {
      optional: true,
      trim: true,
      custom: {
        options: (value, { req }) => {
          if (!value && !req.body.phone) {
            throw new Error(USER_MESSAGES.EMAIL_OR_PHONE_IS_REQUIRED)
          }
          if (value && typeof value !== 'string') {
            throw new Error(USER_MESSAGES.EMAIL_MUST_BE_A_STRING)
          }
          if (value && !value.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
            throw new Error(USER_MESSAGES.EMAIL_IS_INVALID)
          }
          return true
        }
      }
    },
    phone: {
      optional: true,
      trim: true,
      custom: {
        options: (value, { req }) => {
          if (!value && !req.body.email) {
            throw new Error(USER_MESSAGES.EMAIL_OR_PHONE_IS_REQUIRED)
          }
          if (value && typeof value !== 'string') {
            throw new Error(USER_MESSAGES.PHONE_MUST_BE_A_STRING)
          }
          if (value && !value.match(/^\+?[1-9]\d{1,14}$/)) {
            throw new Error(USER_MESSAGES.PHONE_IS_INVALID)
          }
          return true
        }
      }
    },
    password: passwordSchema
  })
)

export const verifyEmailValidation = validate(
  checkSchema({
    code: {
      notEmpty: {
        errorMessage: USER_MESSAGES.VERIFICATION_CODE_IS_REQUIRED
      },
      isString: {
        errorMessage: USER_MESSAGES.VERIFICATION_CODE_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 6,
          max: 6
        },
        errorMessage: USER_MESSAGES.VERIFICATION_CODE_MUST_BE_6_CHARACTERS
      }
    }
  })
)

export const forgotPasswordValidation = validate(
  checkSchema({
    email: {
      optional: true,
      trim: true,
      custom: {
        options: (value, { req }) => {
          if (!value && !req.body.phone) {
            throw new Error(USER_MESSAGES.EMAIL_OR_PHONE_IS_REQUIRED)
          }
          if (value && typeof value !== 'string') {
            throw new Error(USER_MESSAGES.EMAIL_MUST_BE_A_STRING)
          }
          if (value && !value.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
            throw new Error(USER_MESSAGES.EMAIL_IS_INVALID)
          }
          return true
        }
      }
    },
    phone: {
      optional: true,
      trim: true,
      custom: {
        options: (value, { req }) => {
          if (!value && !req.body.email) {
            throw new Error(USER_MESSAGES.EMAIL_OR_PHONE_IS_REQUIRED)
          }
          if (value && typeof value !== 'string') {
            throw new Error(USER_MESSAGES.PHONE_MUST_BE_A_STRING)
          }
          if (value && !value.match(/^\+?[1-9]\d{1,14}$/)) {
            throw new Error(USER_MESSAGES.PHONE_IS_INVALID)
          }
          return true
        }
      }
    }
  })
)

export const resetPasswordValidation = validate(
  checkSchema({
    code: {
      notEmpty: {
        errorMessage: USER_MESSAGES.VERIFICATION_CODE_IS_REQUIRED
      },
      isString: {
        errorMessage: USER_MESSAGES.VERIFICATION_CODE_MUST_BE_A_STRING
      },
      isLength: {
        options: {
          min: 6,
          max: 6
        },
        errorMessage: USER_MESSAGES.VERIFICATION_CODE_MUST_BE_6_CHARACTERS
      }
    },
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema
  })
)

export const accessTokenValidation = validate(
  checkSchema({
    authorization: {
      trim: true,
      custom: {
        options: async (value: string, { req }) => {
          if (!value) {
            throw new ErrorWithStatus({
              message: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
              status: httpStatusCode.UNAUTHORIZED
            })
          }
          const access_token = value.split(' ')[1]
          if (!access_token) {
            throw new ErrorWithStatus({
              message: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
              status: httpStatusCode.UNAUTHORIZED
            })
          }

          try {
            const decodedAuthorization = await verifyToken({
              token: access_token,
              secretOrPublickey: envConfig.jwtSecretAccessToken
            })
            req.decodedAuthorization = decodedAuthorization as TokenPayload
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

export const refreshTokenValidation = validate(
  checkSchema(
    {
      refreshToken: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
                status: httpStatusCode.UNAUTHORIZED
              })
            }

            try {
              const redis = await redisClient
              const blacklistKey = `blacklist:token:${value}`
              const isBlacklisted = await redis.exists(blacklistKey)
              if (isBlacklisted) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: httpStatusCode.UNAUTHORIZED
                })
              }

              const [decodedRefreshToken, refreshToken] = await Promise.all([
                verifyToken({ token: value, secretOrPublickey: envConfig.jwtSecretRefreshToken }),
                databaseServices.tokens.findOne({ token: value, type: TokenType.RefreshToken })
              ])

              if (!refreshToken) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: httpStatusCode.UNAUTHORIZED
                })
              }
              req.decodedRefreshToken = decodedRefreshToken as TokenPayload
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
    },
    ['body']
  )
)
