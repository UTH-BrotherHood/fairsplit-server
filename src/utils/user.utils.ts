import { IUser } from '~/models/schemas/user.schema'
import { ObjectId } from 'mongodb'
import databaseServices from '~/services/database.services'
import redisClient from '~/config/redis'
import { ErrorWithStatus } from './error.utils'
import { USER_MESSAGES } from '~/constants/messages'
import httpStatusCode from '~/core/statusCodes'

/**
 * Remove sensitive fields from user object
 */
export const excludeSensitiveFields = (
  user: any
): Omit<IUser, 'hashPassword' | 'forgotPasswordToken' | 'emailVerifyToken' | 'forgotPassword'> => {
  const { hashPassword, forgotPasswordToken, emailVerifyToken, forgotPassword, ...userWithoutSensitiveData } = user
  return userWithoutSensitiveData
}

/**
 * Get user by ID with sensitive fields excluded
 * This is a common utility function that can be used across the application
 * It handles both database and Redis cache operations
 */
export const getUserById = async (userId: string | ObjectId): Promise<IUser> => {
  const redis = await redisClient
  let user

  // Try to get from Redis first
  const cachedUser = await redis.getObject(`user:${userId}`)
  if (cachedUser) {
    const { hashPassword, ...userWithoutPassword } = cachedUser as IUser
    user = userWithoutPassword
  } else {
    // If not in Redis, get from database
    user = await databaseServices.users.findOne(
      {
        _id: new ObjectId(userId)
      },
      {
        projection: {
          hashPassword: 0,
          forgotPasswordToken: 0,
          emailVerifyToken: 0,
          forgotPassword: 0
        }
      }
    )
  }

  if (!user) {
    throw new ErrorWithStatus({
      message: USER_MESSAGES.USER_NOT_FOUND,
      status: httpStatusCode.NOT_FOUND
    })
  }

  return user
}

/**
 * Update user in both database and Redis cache
 * This function ensures data consistency between database and cache
 * It also ensures sensitive data is never stored in cache
 */
export const updateUserAndCache = async (userId: string | ObjectId, update: Partial<IUser>): Promise<IUser> => {
  // Update in database
  const result = await databaseServices.users.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    {
      $set: {
        ...update,
        updatedAt: new Date()
      }
    },
    { returnDocument: 'after' }
  )

  if (!result) {
    throw new ErrorWithStatus({
      message: USER_MESSAGES.USER_NOT_FOUND,
      status: httpStatusCode.NOT_FOUND
    })
  }

  // Remove sensitive fields
  const userWithoutSensitiveData = excludeSensitiveFields(result)

  // Update Redis cache
  const redis = await redisClient
  if (redis) {
    await redis.del(`user:${userId}`)
    await redis.setObject(`user:${userId}`, userWithoutSensitiveData, 3600)
  }

  return userWithoutSensitiveData
}
