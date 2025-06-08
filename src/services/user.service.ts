import { ErrorWithStatus } from '~/utils/error.utils'
import databaseServices from './database.services'
import redisClient from '~/config/redis'
import { ObjectId } from 'mongodb'
import { httpStatusCode } from '~/core/httpStatusCode'

class UsersService {
  async findById(id: string) {
    return await databaseServices.users.findOne({ _id: new ObjectId(id) })
  }

  async checkEmailExist(email: string) {
    const user = await databaseServices.users.findOne({ email })
    return !!user
  }

  async searchUserByEmail(query: string) {
    // Sanitize and validate query
    const sanitizedQuery = query.trim().toLowerCase()

    if (sanitizedQuery.length < 3) {
      throw new ErrorWithStatus({
        message: 'Search query must be at least 3 characters long',
        status: httpStatusCode.BAD_REQUEST
      })
    }

    // Initialize Redis client
    const redis = await redisClient

    // Check if search result is cached
    const cacheKey = `user:search:${sanitizedQuery}`
    const cachedResults = await redis.getObject(cacheKey)
    if (cachedResults) return cachedResults

    const result = await databaseServices.users
      .aggregate([
        {
          $search: {
            index: 'email_index',
            compound: {
              must: [
                {
                  text: {
                    query: sanitizedQuery,
                    path: 'email',
                    fuzzy: {
                      maxEdits: 1,
                      prefixLength: 3
                    }
                  }
                }
              ]
            }
          }
        },
        {
          $match: {
            email: new RegExp('^' + sanitizedQuery, 'i')
          }
        },
        {
          $limit: 5
        },
        {
          $project: {
            _id: 1,
            username: 1,
            email: 1,
            avatar_url: 1,
            status: 1,
            verify: 1,
            created_at: 1
          }
        }
      ])
      .toArray()

    const users = result.map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
      status: user.status,
      verify: user.verify,
      created_at: user.created_at,
      accountType: user.accountType
    }))

    // Cache the search results for 10 minutes
    await redis.setObject(cacheKey, users, 10 * 60)

    return users
  }
}

const usersService = new UsersService()
export default usersService
