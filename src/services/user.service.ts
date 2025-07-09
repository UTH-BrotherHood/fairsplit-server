import databaseServices from './database.services'
import { ObjectId, Sort } from 'mongodb'
import { USER_MESSAGES } from '~/constants/messages'
import { excludeSensitiveFields, getUserById, updateUserAndCache } from '~/utils/user.utils'
import { hashPassword, comparePassword } from '~/utils/crypto'
import { FriendRequestStatus } from '~/models/schemas/friendRequest.schema'
import { IFriendRequest } from '~/models/schemas/friendRequest.schema'
import { ChangePasswordReqBody, SearchUsersReqQuery } from '~/models/requests/user.requests'
import { ErrorWithStatus } from '~/utils/error.utils'
import { httpStatusCode } from '~/core/httpStatusCode'

class UsersService {
  private users = databaseServices.users
  private friendRequests = databaseServices.friendRequests

  async getMe(userId: string) {
    const user = await getUserById(userId)
    if (!user) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    return excludeSensitiveFields(user)
  }

  async updateMe(userId: string, payload: any) {
    const user = await getUserById(userId)
    if (!user) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    await updateUserAndCache(userId, payload)

    return excludeSensitiveFields(user)
  }

  async changePassword(userId: string, payload: ChangePasswordReqBody) {
    const user = await getUserById(userId)
    if (!user) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    const isMatch = await comparePassword(payload.oldPassword, user.hashPassword as string)
    if (!isMatch) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.OLD_PASSWORD_NOT_MATCH,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    const hashedPassword = await hashPassword(payload.newPassword)
    await updateUserAndCache(userId, { hashPassword: hashedPassword })

    return true
  }

  async searchUsers(userId: string, query: SearchUsersReqQuery) {
    // Validate and transform input parameters with defaults
    const searchQuery = {
      q: (query.q || '').trim(),
      page: Math.max(1, Number(query.page) || 1),
      limit: Math.min(100, Math.max(1, Number(query.limit) || 10)),
      sortBy: ['username', 'email', 'phone'].includes(query.sortBy as string) ? query.sortBy : 'username',
      sortOrder: query.sortOrder === 'DESC' ? -1 : 1
    }

    const skip = (searchQuery.page - 1) * searchQuery.limit

    // Build search condition
    const searchCondition: any = {
      _id: { $ne: new ObjectId(userId) }
    }

    if (searchQuery.q) {
      searchCondition.$or = [
        { username: { $regex: searchQuery.q, $options: 'i' } },
        { email: { $regex: searchQuery.q, $options: 'i' } },
        { phone: { $regex: searchQuery.q, $options: 'i' } }
      ]
    }

    // Define projection to exclude sensitive fields
    const projection = {
      hashPassword: 0,
      forgotPasswordToken: 0,
      emailVerifyToken: 0,
      forgotPassword: 0,
      // blockedUsers: 0,
      friends: 0,
      groups: 0,
      preferences: 0,
      privacySettings: 0,
      verify: 0,
      verificationType: 0,
      google: 0,
      createdAt: 0,
      updatedAt: 0
    }

    // Execute queries in parallel for better performance
    const [users, total] = await Promise.all([
      this.users
        .find(searchCondition, { projection })
        .sort({ [searchQuery.sortBy as string]: searchQuery.sortOrder } as Sort)
        .skip(skip)
        .limit(searchQuery.limit)
        .toArray(),
      this.users.countDocuments(searchCondition)
    ])

    return {
      users: users.map((user) => excludeSensitiveFields(user)),
      pagination: {
        page: searchQuery.page,
        limit: searchQuery.limit,
        total,
        totalPages: Math.ceil(total / searchQuery.limit)
      }
    }
  }

  async updatePreferences(userId: string, preferences: any) {
    await updateUserAndCache(userId, { preferences })

    return true
  }

  async updatePrivacySettings(userId: string, settings: any) {
    await updateUserAndCache(userId, { privacySettings: settings })

    return true
  }

  // async blockUser(userId: string, targetUserId: ObjectId, reason?: string) {
  //   if (userId === targetUserId.toString()) {
  //     throw new ErrorWithStatus({
  //       message: USER_MESSAGES.CANNOT_BLOCK_YOURSELF,
  //       status: httpStatusCode.BAD_REQUEST
  //     })
  //   }

  //   const user = await getUserById(userId)
  //   if (!user) {
  //     throw new ErrorWithStatus({
  //       message: USER_MESSAGES.USER_NOT_FOUND,
  //       status: httpStatusCode.NOT_FOUND
  //     })
  //   }

  //   const targetUser = await getUserById(targetUserId)
  //   if (!targetUser) {
  //     throw new ErrorWithStatus({
  //       message: USER_MESSAGES.USER_NOT_FOUND,
  //       status: httpStatusCode.NOT_FOUND
  //     })
  //   }

  //   const isAlreadyBlocked = user.blockedUsers?.some(
  //     (blockedUser) => blockedUser.userId.toString() === targetUserId.toString()
  //   )

  //   if (isAlreadyBlocked) {
  //     throw new ErrorWithStatus({
  //       message: USER_MESSAGES.USER_ALREADY_BLOCKED,
  //       status: httpStatusCode.BAD_REQUEST
  //     })
  //   }

  //   await updateUserAndCache(userId, {
  //     blockedUsers: [
  //       ...(user.blockedUsers || []),
  //       {
  //         userId: targetUserId,
  //         reason,
  //         createdAt: new Date()
  //       }
  //     ]
  //   })

  //   // Remove any existing friend connections or requests
  //   await Promise.all([
  //     updateUserAndCache(userId, {
  //       friends: user.friends?.filter((friendId) => friendId.toString() !== targetUserId.toString())
  //     }),
  //     updateUserAndCache(targetUserId, {
  //       friends: targetUser.friends?.filter((friendId) => friendId.toString() !== userId.toString())
  //     }),
  //     this.friendRequests.deleteMany({
  //       $or: [
  //         {
  //           fromUserId: new ObjectId(userId),
  //           toUserId: targetUserId
  //         },
  //         {
  //           fromUserId: targetUserId,
  //           toUserId: new ObjectId(userId)
  //         }
  //       ]
  //     })
  //   ])

  //   return true
  // }

  // async unblockUser(userId: string, targetUserId: ObjectId) {
  //   if (userId === targetUserId.toString()) {
  //     throw new ErrorWithStatus({
  //       message: USER_MESSAGES.CANNOT_UNBLOCK_YOURSELF,
  //       status: httpStatusCode.BAD_REQUEST
  //     })
  //   }

  //   const user = await getUserById(userId)
  //   if (!user) {
  //     throw new ErrorWithStatus({
  //       message: USER_MESSAGES.USER_NOT_FOUND,
  //       status: httpStatusCode.NOT_FOUND
  //     })
  //   }

  //   const isBlocked = user.blockedUsers?.some(
  //     (blockedUser) => blockedUser.userId.toString() === targetUserId.toString()
  //   )

  //   if (!isBlocked) {
  //     throw new ErrorWithStatus({
  //       message: USER_MESSAGES.USER_NOT_BLOCKED,
  //       status: httpStatusCode.BAD_REQUEST
  //     })
  //   }

  //   await updateUserAndCache(userId, {
  //     blockedUsers: user.blockedUsers?.filter(
  //       (blockedUser) => blockedUser.userId.toString() !== targetUserId.toString()
  //     )
  //   })

  //   return true
  // }

  // async getBlockedUsers(userId: string) {
  //   const user = await getUserById(userId)
  //   if (!user) {
  //     throw new ErrorWithStatus({
  //       message: USER_MESSAGES.USER_NOT_FOUND,
  //       status: httpStatusCode.NOT_FOUND
  //     })
  //   }

  //   const blockedUsers = await Promise.all(
  //     (user.blockedUsers || []).map(async (blockedUser) => {
  //       const user = await getUserById(blockedUser.userId)
  //       if (!user) return null

  //       return {
  //         ...excludeSensitiveFields(user),
  //         blockedAt: blockedUser.createdAt,
  //         reason: blockedUser.reason
  //       }
  //     })
  //   )

  //   return blockedUsers.filter(Boolean)
  // }

  async sendFriendRequest(userId: string, targetUserId: ObjectId) {
    if (userId === targetUserId.toString()) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.CANNOT_SEND_FRIEND_REQUEST_TO_YOURSELF,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    const [user, targetUser] = await Promise.all([getUserById(userId), getUserById(targetUserId)])

    if (!user || !targetUser) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    // Check if users are already friends
    if (user.friends?.some((friendId) => friendId.toString() === targetUserId.toString())) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.CANNOT_SEND_FRIEND_REQUEST_TO_FRIEND,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    // // Check if the target user has blocked the sender
    // if (targetUser.blockedUsers?.some((blockedUser) => blockedUser.userId.toString() === userId)) {
    //   throw new ErrorWithStatus({
    //     message: USER_MESSAGES.CANNOT_SEND_FRIEND_REQUEST_TO_USER_WHO_BLOCKED_YOU,
    //     status: httpStatusCode.BAD_REQUEST
    //   })
    // }

    // // Check if the sender has blocked the target user
    // if (user.blockedUsers?.some((blockedUser) => blockedUser.userId.toString() === targetUserId.toString())) {
    //   throw new ErrorWithStatus({
    //     message: USER_MESSAGES.CANNOT_SEND_FRIEND_REQUEST_TO_BLOCKED_USER,
    //     status: httpStatusCode.BAD_REQUEST
    //   })
    // }

    // Check if there's already a pending request
    const existingRequest = await this.friendRequests.findOne({
      $or: [
        {
          fromUserId: new ObjectId(userId),
          toUserId: targetUserId,
          status: FriendRequestStatus.Pending
        },
        {
          fromUserId: targetUserId,
          toUserId: new ObjectId(userId),
          status: FriendRequestStatus.Pending
        }
      ]
    })

    if (existingRequest) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.FRIEND_REQUEST_ALREADY_SENT,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    await this.friendRequests.insertOne({
      fromUserId: new ObjectId(userId),
      toUserId: targetUserId,
      status: FriendRequestStatus.Pending,
      createdAt: new Date()
    })

    return true
  }

  async acceptFriendRequest(userId: string, requestId: ObjectId) {
    const request = await this.friendRequests.findOne<IFriendRequest>({
      _id: requestId,
      toUserId: new ObjectId(userId),
      status: FriendRequestStatus.Pending
    })

    if (!request) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.FRIEND_REQUEST_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    const [user, fromUser] = await Promise.all([getUserById(userId), getUserById(request.fromUserId.toString())])

    await Promise.all([
      // Update request status
      this.friendRequests.updateOne(
        { _id: requestId },
        {
          $set: {
            status: FriendRequestStatus.Accepted,
            updatedAt: new Date()
          }
        }
      ),
      // Add each user to the other's friends list
      updateUserAndCache(userId, {
        friends: [...(user.friends || []), request.fromUserId]
      }),
      updateUserAndCache(request.fromUserId.toString(), {
        friends: [...(fromUser.friends || []), new ObjectId(userId)]
      })
    ])

    return true
  }

  async rejectFriendRequest(userId: string, requestId: ObjectId) {
    const request = await this.friendRequests.findOne<IFriendRequest>({
      _id: requestId,
      toUserId: new ObjectId(userId),
      status: FriendRequestStatus.Pending
    })

    if (!request) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.FRIEND_REQUEST_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    await this.friendRequests.updateOne(
      { _id: requestId },
      { $set: { status: FriendRequestStatus.Rejected, updatedAt: new Date() } }
    )

    return true
  }

  async cancelFriendRequest(userId: string, requestId: ObjectId) {
    const request = await this.friendRequests.findOne<IFriendRequest>({
      _id: requestId,
      fromUserId: new ObjectId(userId),
      status: FriendRequestStatus.Pending
    })

    if (!request) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.FRIEND_REQUEST_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    await this.friendRequests.updateOne(
      { _id: requestId },
      {
        $set: {
          status: FriendRequestStatus.Cancelled,
          updatedAt: new Date()
        }
      }
    )

    return true
  }

  async getFriends(userId: string) {
    const user = await getUserById(userId)
    if (!user) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    if (!user.friends || user.friends.length === 0) {
      return []
    }

    const friends = await databaseServices.users
      .find({ _id: { $in: user.friends.map((friend) => new ObjectId(friend)) } })
      .toArray()
    const friendRequests = await databaseServices.friendRequests
      .find({
        $or: [
          { fromUserId: { $in: user.friends.map((friend) => new ObjectId(friend)) } },
          { toUserId: { $in: user.friends.map((friend) => new ObjectId(friend)) } }
        ]
      })
      .toArray()

    return {
      friends: friends.map((friend) => excludeSensitiveFields(friend)),
      friendRequests: friendRequests.map((request) => ({
        ...request,
        user: excludeSensitiveFields(request.fromUserId.toString() === userId ? request.toUserId : request.fromUserId)
      }))
    }
  }

  async getFriendRequests(userId: string) {
    const requests = await this.friendRequests
      .find({
        $or: [{ fromUserId: new ObjectId(userId) }, { toUserId: new ObjectId(userId) }],
        status: FriendRequestStatus.Pending
      })
      .toArray()

    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const otherUserId = request.fromUserId.toString() === userId ? request.toUserId : request.fromUserId

        const otherUser = await getUserById(otherUserId)
        if (!otherUser) return null

        return {
          ...request,
          user: excludeSensitiveFields(otherUser),
          isOutgoing: request.fromUserId.toString() === userId
        }
      })
    )

    return enrichedRequests.filter(Boolean)
  }

  async getUserActivity(userId: string) {
    const user = await getUserById(userId)
    if (!user) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    // Get friend requests count
    const friendRequestsCount = await this.friendRequests.countDocuments({
      $or: [
        { fromUserId: new ObjectId(userId), status: FriendRequestStatus.Pending },
        { toUserId: new ObjectId(userId), status: FriendRequestStatus.Pending }
      ]
    })

    return {
      totalFriends: user.friends?.length || 0,
      totalGroups: user.groups?.length || 0,
      // totalBlockedUsers: user.blockedUsers?.length || 0,
      totalPendingFriendRequests: friendRequestsCount,
      lastActive: user.updatedAt,
      accountAge: new Date().getTime() - user.createdAt.getTime()
    }
  }

  async getUserStatistics(userId: string) {
    const user = await getUserById(userId)
    if (!user) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    return {
      totalFriends: user.friends?.length || 0,
      totalGroups: user.groups?.length || 0,
      // totalBlockedUsers: user.blockedUsers?.length || 0,
      accountAge: new Date().getTime() - user.createdAt.getTime(),
      lastActive: user.updatedAt
    }
  }

  async getSuggestedUsers(userId: string) {
    // Get user's friends and blocked users
    const user = await getUserById(userId)
    if (!user) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    // Find users who are not friends and not blocked
    const suggestedUsers = await this.users
      .find({
        $and: [
          { _id: { $ne: new ObjectId(userId) } },
          { _id: { $nin: user.friends || [] } }
          // { _id: { $nin: (user.blockedUsers || []).map((b) => b.userId) } }
        ]
      })
      .limit(10)
      .toArray()

    return suggestedUsers.map((user) => excludeSensitiveFields(user))
  }

  async getTrendingUsers(userId: string) {
    // This is a simplified version. In a real app, you'd want to:
    // 1. Track user interactions/activity
    // 2. Calculate trending score based on recent activity
    // 3. Cache results
    // 4. Update periodically
    const trendingUsers = await this.users
      .find({
        _id: { $ne: new ObjectId(userId) }
      })
      .sort({ updatedAt: -1 })
      .limit(10)
      .toArray()

    return trendingUsers.map((user) => excludeSensitiveFields(user))
  }

  async getUserPreferences(userId: string) {
    const user = await getUserById(userId)
    if (!user) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    return user.preferences || {}
  }

  async getPrivacySettings(userId: string) {
    const user = await getUserById(userId)
    if (!user) {
      throw new ErrorWithStatus({
        message: USER_MESSAGES.USER_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    return (
      user.privacySettings || {
        profileVisibility: 'public',
        friendRequests: 'everyone'
      }
    )
  }
}

const usersService = new UsersService()
export default usersService
