'use strict'

import { ObjectId } from 'mongodb'
import { IUser, User, UserVerificationStatus, UserVerificationType } from '~/models/schemas/user.schema'
import { envConfig } from '~/config/env'
import { signToken, verifyToken } from '~/utils/token.utils'
import { ErrorWithStatus } from '~/utils/error.utils'
import { TOKEN_MESSAGES, USER_MESSAGES } from '~/constants/messages'
import httpStatusCode from '~/core/statusCodes'
import databaseServices from './database.services'
import redisClient from '~/config/redis'
import { logger } from '~/loggers/my-logger.log'
import emailService from './email.service'
import { RegisterReqBody, LoginReqBody, TokenPayload, ForgotPasswordReqBody } from '~/models/requests/user.requests'
import { excludeSensitiveFields } from '~/utils/user.utils'
import { TokenType, Token } from '~/models/schemas/token.schema'
import { comparePassword, hashPassword } from '~/utils/crypto'
import { generateVerificationCode } from '~/utils/verification'
import { VerificationCode, VerificationCodeType } from '~/models/schemas/verificationCode.schema'
import smsService from './sms.service'

class AuthService {
  private signAccessToken({ userId, verify }: { userId: string; verify: UserVerificationStatus }) {
    return signToken({
      payload: {
        userId,
        tokenType: TokenType.AccessToken,
        verify
      },
      privateKey: envConfig.jwtSecretAccessToken,
      options: {
        expiresIn: envConfig.accessTokenExpiresIn
      }
    })
  }

  private signRefreshToken({ userId, verify, exp }: { userId: string; verify: UserVerificationStatus; exp?: number }) {
    if (exp) {
      return signToken({
        payload: {
          userId,
          tokenType: TokenType.RefreshToken,
          verify,
          exp
        },
        privateKey: envConfig.jwtSecretRefreshToken,
        options: {
          expiresIn: exp
        }
      })
    }
    return signToken({
      payload: {
        userId,
        tokenType: TokenType.RefreshToken,
        verify
      },
      privateKey: envConfig.jwtSecretRefreshToken,
      options: {
        expiresIn: envConfig.refreshTokenExpiresIn
      }
    })
  }

  async decodeRefreshToken(refreshToken: string) {
    return (await verifyToken({
      token: refreshToken,
      secretOrPublickey: envConfig.jwtSecretRefreshToken
    })) as TokenPayload
  }

  async signAccessAndRefreshToken({ userId, verify }: { userId: string; verify: UserVerificationStatus }) {
    return Promise.all([this.signAccessToken({ userId, verify }), this.signRefreshToken({ userId, verify })])
  }

  async register(payload: RegisterReqBody) {
    const { username, email, phone, password, verificationType, dateOfBirth, avatarUrl } = payload
    const hashedPassword = await hashPassword(password)

    const newUser = new User({
      username,
      email,
      phone,
      avatarUrl,
      dateOfBirth: new Date(dateOfBirth),
      hashPassword: hashedPassword,
      verify: UserVerificationStatus.Unverified,
      verificationType,
      groups: []
    })

    const result = await databaseServices.users.insertOne(newUser)

    const verificationCode = generateVerificationCode().toString()

    logger.info('Generated verification code', 'AuthService.register', '', {
      userId: result.insertedId.toString(),
      code: verificationCode
    })

    const verificationCodeDoc = new VerificationCode({
      userId: result.insertedId,
      code: verificationCode,
      type: VerificationCodeType.EmailVerification,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    })

    try {
      logger.info('Attempting to save verification code', 'AuthService.register', '', {
        userId: result.insertedId.toString(),
        collectionName: envConfig.dbVerificationCodeCollection
      })

      await databaseServices.verificationCodes.insertOne(verificationCodeDoc)
      logger.info('Verification code saved to database', 'AuthService.register', '', {
        userId: result.insertedId.toString()
      })
    } catch (error) {
      logger.error('Failed to save verification code', 'AuthService.register', '', {
        userId: result.insertedId.toString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        verificationCode: verificationCodeDoc
      })
      throw new ErrorWithStatus({
        message: USER_MESSAGES.VERIFICATION_CODE_CREATION_FAILED,
        status: httpStatusCode.INTERNAL_SERVER_ERROR
      })
    }

    // Send verification code
    if (verificationType === UserVerificationType.Email && email) {
      await emailService.sendVerificationCode(email, username, verificationCode)
    } else if (verificationType === UserVerificationType.Phone && phone) {
      await smsService.sendVerificationCode(phone, verificationCode)
    }

    const userResponse = excludeSensitiveFields(newUser)
    return {
      user: userResponse,
      verificationCode,
      emailSent: true
    }
  }

  async login({ email, phone, password }: LoginReqBody) {
    const user = await databaseServices.users.findOne({ $or: [{ email }, { phone }] })

    if (!user) {
      throw new ErrorWithStatus({
        message: email ? USER_MESSAGES.EMAIL_OR_PASSWORD_INCORRECT : USER_MESSAGES.PHONE_OR_PASSWORD_INCORRECT,
        status: httpStatusCode.UNAUTHORIZED
      })
    }

    const isPasswordValid = await comparePassword(password, user.hashPassword as string)

    if (!isPasswordValid) {
      throw new ErrorWithStatus({
        message: email ? USER_MESSAGES.EMAIL_OR_PASSWORD_INCORRECT : USER_MESSAGES.PHONE_OR_PASSWORD_INCORRECT,
        status: httpStatusCode.UNAUTHORIZED
      })
    }

    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken({
      userId: user._id.toString(),
      verify: user.verify
    })

    await databaseServices.users.updateOne(
      { _id: user._id },
      {
        $set: {
          lastLoginTime: new Date()
        }
      }
    )

    await databaseServices.tokens.deleteMany({
      userId: user._id,
      type: TokenType.RefreshToken
    })

    const { exp } = await this.decodeRefreshToken(refreshToken)

    await databaseServices.tokens.insertOne(
      new Token({
        userId: user._id,
        token: refreshToken,
        type: TokenType.RefreshToken,
        expiresAt: new Date((exp as number) * 1000)
      })
    )

    const userResponse = excludeSensitiveFields(user)

    // Store updated user in Redis cache
    const redis = await redisClient
    await redis.setObject(`user:${user._id.toString()}`, userResponse, 1800)

    return {
      accessToken,
      refreshToken,
      user: userResponse
    }
  }

  async googleLogin(user: IUser) {
    if (!user) {
      throw new ErrorWithStatus({
        status: httpStatusCode.UNAUTHORIZED,
        message: USER_MESSAGES.USER_NOT_FOUND
      })
    }

    // Đảm bảo người dùng luôn được verify khi đăng nhập bằng Google
    await databaseServices.users.updateOne(
      { _id: new ObjectId(user._id?.toString() || '') },
      {
        $set: {
          verify: UserVerificationStatus.Verified,
          lastLoginTime: new Date(),
          status: 'online',
          updatedAt: new Date()
        }
      }
    )

    logger.info(`Google login attempt for user: ${user.email}`, 'AuthService.googleLogin', '', {
      userId: user._id?.toString(),
      email: user.email
    })

    // Lấy thông tin user đã cập nhật từ database
    const updatedUser = await databaseServices.users.findOne({ _id: new ObjectId(user._id) })

    if (!updatedUser) {
      logger.error('Updated user not found after Google login', 'AuthService.googleLogin', '', {
        userId: user._id?.toString()
      })
      throw new ErrorWithStatus({
        status: httpStatusCode.NOT_FOUND,
        message: USER_MESSAGES.USER_NOT_FOUND
      })
    }

    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken({
      userId: updatedUser._id.toString(),
      verify: UserVerificationStatus.Verified // Luôn sử dụng Verified cho Google login
    })

    await databaseServices.tokens.deleteMany({
      userId: updatedUser._id,
      type: TokenType.RefreshToken
    })

    const { exp } = await this.decodeRefreshToken(refreshToken)

    await databaseServices.tokens.insertOne(
      new Token({
        userId: new ObjectId(updatedUser._id.toString()),
        token: refreshToken,
        type: TokenType.RefreshToken,
        expiresAt: new Date((exp as number) * 1000)
      })
    )

    // Fetch complete user data for response
    const userResponse = await databaseServices.users.findOne(
      { _id: new ObjectId(updatedUser._id.toString()) },
      {
        projection: {
          password: 0,
          forgotPasswordToken: 0,
          emailVerifyToken: 0,
          forgotPassword: 0
        }
      }
    )

    if (!userResponse) {
      logger.error('User response not found after Google login', 'AuthService.googleLogin', '', {
        userId: updatedUser._id.toString()
      })
      throw new ErrorWithStatus({
        status: httpStatusCode.NOT_FOUND,
        message: USER_MESSAGES.USER_NOT_FOUND
      })
    }

    // Store updated user in Redis cache
    const redis = await redisClient
    await redis.setObject(`user:${updatedUser._id.toString()}`, userResponse, 1800)

    logger.info('Google login successful', 'AuthService.googleLogin', '', {
      userId: updatedUser._id.toString(),
      email: updatedUser.email
    })

    return {
      accessToken,
      refreshToken,
      user: userResponse
    }
  }

  async logout({ userId, refreshToken }: { userId: string; refreshToken: string }) {
    logger.info('User logging out', 'AuthService.logout', '', { userId })

    const redis = await redisClient
    const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60 // 30 days in seconds

    try {
      const blacklistKey = `blacklist:token:${refreshToken}`
      const result = await redis.setObject(
        blacklistKey,
        {
          token: refreshToken,
          userId,
          type: TokenType.RefreshToken,
          blacklistedAt: new Date().toISOString()
        },
        THIRTY_DAYS_IN_SECONDS
      )

      if (!result) {
        throw new Error('Failed to set blacklist in Redis')
      }

      logger.info('Refresh token blacklisted successfully', 'AuthService.logout', '', {
        userId,
        blacklistKey
      })
    } catch (error) {
      logger.error('Failed to blacklist refresh token', 'AuthService.logout', '', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw new ErrorWithStatus({
        status: httpStatusCode.INTERNAL_SERVER_ERROR,
        message: TOKEN_MESSAGES.TOKEN_BLACKLIST_FAILED
      })
    }

    // Remove user from Redis cache
    await redis.del(`user:${userId}`)

    const result = await Promise.all([
      databaseServices.tokens.deleteOne({
        userId: new ObjectId(userId),
        token: refreshToken,
        type: TokenType.RefreshToken
      }),
      databaseServices.users.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            lastLoginTime: new Date()
          }
        }
      )
    ])
    logger.info('User logged out successfully', 'AuthService.logout', '', { userId })

    return {
      success: result.every((r) => r.acknowledged)
    }
  }

  async refreshToken({
    userId,
    verify,
    refreshToken
  }: {
    userId: string
    verify: UserVerificationStatus
    refreshToken: string
  }) {
    logger.info('Refreshing token', 'AuthService.refreshToken', '', { userId })

    const user = await databaseServices.users.findOne({ _id: new ObjectId(userId) })

    if (!user) {
      logger.error('User not found during token refresh', 'AuthService.refreshToken', '', { userId })
      throw new ErrorWithStatus({
        status: httpStatusCode.NOT_FOUND,
        message: USER_MESSAGES.USER_NOT_FOUND
      })
    }

    const token = await databaseServices.tokens.findOne({
      userId: new ObjectId(userId),
      token: refreshToken,
      type: TokenType.RefreshToken
    })

    if (!token) {
      logger.error('Token not found during refresh', 'AuthService.refreshToken', '', { userId })
      throw new ErrorWithStatus({
        status: httpStatusCode.UNAUTHORIZED,
        message: TOKEN_MESSAGES.TOKEN_NOT_FOUND
      })
    }

    const { iat: iatRefreshToken, exp: expRefreshToken } = await this.decodeRefreshToken(refreshToken)

    if (expRefreshToken && expRefreshToken < Date.now() / 1000) {
      logger.error('Token expired during refresh', 'AuthService.refreshToken', '', {
        userId,
        expiry: new Date(expRefreshToken * 1000).toISOString()
      })
      throw new ErrorWithStatus({
        status: httpStatusCode.UNAUTHORIZED,
        message: TOKEN_MESSAGES.TOKEN_IS_EXPIRED
      })
    }

    // Blacklist old refresh token first
    const redis = await redisClient
    const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60 // 30 days in seconds

    try {
      const blacklistKey = `blacklist:token:${refreshToken}`
      const result = await redis.setObject(
        blacklistKey,
        {
          token: refreshToken,
          userId,
          type: TokenType.RefreshToken,
          blacklistedAt: new Date().toISOString()
        },
        THIRTY_DAYS_IN_SECONDS
      )

      if (!result) {
        throw new Error('Failed to set blacklist in Redis')
      }

      logger.info('Old refresh token blacklisted successfully', 'AuthService.refreshToken', '', {
        userId,
        blacklistKey
      })
    } catch (error) {
      logger.error('Failed to blacklist old refresh token', 'AuthService.refreshToken', '', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw new ErrorWithStatus({
        status: httpStatusCode.INTERNAL_SERVER_ERROR,
        message: TOKEN_MESSAGES.TOKEN_BLACKLIST_FAILED
      })
    }

    // Delete old refresh token from database
    try {
      await databaseServices.tokens.deleteOne({ _id: token._id })
      logger.info('Old refresh token deleted from database', 'AuthService.refreshToken', '', { userId })
    } catch (error) {
      logger.error('Failed to delete old refresh token from database', 'AuthService.refreshToken', '', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      // Even if database deletion fails, continue since token is blacklisted
    }

    // Generate new tokens only after successful blacklisting
    const [accessToken, newRefreshToken] = await this.signAccessAndRefreshToken({
      userId,
      verify
    })

    const { exp: newExpRefreshToken } = await this.decodeRefreshToken(newRefreshToken)

    try {
      await databaseServices.tokens.insertOne(
        new Token({
          userId: new ObjectId(userId),
          token: newRefreshToken,
          type: TokenType.RefreshToken,
          expiresAt: new Date((newExpRefreshToken as number) * 1000),
          createdAt: new Date((iatRefreshToken as number) * 1000)
        })
      )
      logger.info('New refresh token stored in database', 'AuthService.refreshToken', '', { userId })
    } catch (error) {
      logger.error('Failed to store new refresh token in database', 'AuthService.refreshToken', '', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw new ErrorWithStatus({
        status: httpStatusCode.INTERNAL_SERVER_ERROR,
        message: TOKEN_MESSAGES.TOKEN_CREATION_FAILED
      })
    }

    logger.info('Token refreshed successfully', 'AuthService.refreshToken', '', { userId })

    const userResponse = excludeSensitiveFields(user)

    // Update user in Redis cache
    await redis.setObject(`user:${userId}`, userResponse, 1800)

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: userResponse
    }
  }

  async verifyEmail(userId: string, code: string) {
    // Find verification code
    const verificationCode = await databaseServices.verificationCodes.findOne({
      userId: new ObjectId(userId),
      code,
      type: VerificationCodeType.EmailVerification,
      isUsed: false
    })

    if (!verificationCode) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.VERIFICATION_CODE_IS_INVALID,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    if (verificationCode.expiresAt.getTime() < Date.now()) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.VERIFICATION_CODE_EXPIRED,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    // Update user verification status
    const result = await databaseServices.users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          verify: UserVerificationStatus.Verified,
          updatedAt: new Date()
        }
      }
    )

    if (!result.modifiedCount) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    // Mark verification code as used
    await databaseServices.verificationCodes.updateOne(
      { _id: verificationCode._id },
      {
        $set: {
          isUsed: true
        }
      }
    )

    return { verified: true }
  }

  async verifyPhone(userId: string, code: string) {
    // Find verification code
    const verificationCode = await databaseServices.verificationCodes.findOne({
      userId: new ObjectId(userId),
      code,
      type: VerificationCodeType.EmailVerification,
      isUsed: false
    })

    if (!verificationCode) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.VERIFICATION_CODE_IS_INVALID,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    if (verificationCode.expiresAt.getTime() < Date.now()) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.VERIFICATION_CODE_EXPIRED,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    // Update user verification status
    const result = await databaseServices.users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          verify: UserVerificationStatus.Verified,
          updatedAt: new Date()
        }
      }
    )

    if (!result.modifiedCount) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    // Mark verification code as used
    await databaseServices.verificationCodes.updateOne(
      { _id: verificationCode._id },
      {
        $set: {
          isUsed: true
        }
      }
    )

    return { verified: true }
  }

  async resendVerificationEmail(email: string) {
    // Find user
    const user = await databaseServices.users.findOne({ email })

    if (!user) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.EMAIL_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    if (user.verify === UserVerificationStatus.Verified) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.EMAIL_ALREADY_VERIFIED,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode()
    const verificationCodeDoc = new VerificationCode({
      userId: user._id,
      code: verificationCode,
      type: VerificationCodeType.EmailVerification,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    })

    // Save verification code to database
    await databaseServices.verificationCodes.insertOne(verificationCodeDoc)

    // Send verification code
    await emailService.sendVerificationCode(email, user.username, verificationCode)

    return { success: true }
  }

  async resendVerificationSMS(phone: string) {
    // Find user
    const user = await databaseServices.users.findOne({ phone })

    if (!user) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.PHONE_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    if (user.verify === UserVerificationStatus.Verified) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.PHONE_ALREADY_VERIFIED,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode()
    const verificationCodeDoc = new VerificationCode({
      userId: user._id,
      code: verificationCode,
      type: VerificationCodeType.EmailVerification,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    })

    // Save verification code to database
    await databaseServices.verificationCodes.insertOne(verificationCodeDoc)

    // Send verification code
    await smsService.sendVerificationCode(phone, verificationCode)

    return { success: true }
  }

  async forgotPassword({ email, phone }: ForgotPasswordReqBody) {
    // Find user
    const user = await databaseServices.users.findOne({
      $or: [{ email }, { phone }]
    })

    if (!user) {
      throw new ErrorWithStatus({
        message: email ? USER_MESSAGES.EMAIL_NOT_FOUND : USER_MESSAGES.PHONE_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    // Generate verification code
    const verificationCode = generateVerificationCode()
    const verificationCodeDoc = new VerificationCode({
      userId: user._id,
      code: verificationCode,
      type: VerificationCodeType.PasswordReset,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    })

    // Save verification code to database
    await databaseServices.verificationCodes.insertOne(verificationCodeDoc)

    // Send verification code
    if (email) {
      await emailService.sendVerificationCode(email, user.username, verificationCode)
    } else if (phone) {
      await smsService.sendVerificationCode(phone, verificationCode)
    }

    return { success: true }
  }

  async resetPassword(code: string, newPassword: string) {
    // Find verification code
    const verificationCode = await databaseServices.verificationCodes.findOne({
      code,
      type: VerificationCodeType.PasswordReset,
      isUsed: false
    })

    if (!verificationCode) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.VERIFICATION_CODE_IS_INVALID,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    if (verificationCode.expiresAt.getTime() < Date.now()) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.VERIFICATION_CODE_EXPIRED,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update user password
    const result = await databaseServices.users.updateOne(
      { _id: verificationCode.userId },
      {
        $set: {
          hashPassword: hashedPassword,
          updatedAt: new Date()
        }
      }
    )

    if (!result.modifiedCount) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    // Mark verification code as used
    await databaseServices.verificationCodes.updateOne(
      { _id: verificationCode._id },
      {
        $set: {
          isUsed: true
        }
      }
    )

    // Revoke all refresh tokens
    await databaseServices.tokens.deleteMany({
      userId: verificationCode.userId,
      type: TokenType.RefreshToken
    })

    return { success: true }
  }
}

const authService = new AuthService()
export default authService
