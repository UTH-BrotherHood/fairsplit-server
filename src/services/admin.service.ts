import { AdminLoginReqBody, SystemSettingsReqBody, ProjectStatusReqBody } from '~/models/requests/admin.requests'
import { ErrorWithStatus } from '~/utils/error.utils'
import { httpStatusCode } from '~/core/httpStatusCode'
import { ADMIN_MESSAGES } from '~/constants/messages'
import databaseServices from '~/services/database.services'
import { ObjectId } from 'mongodb'
import { TokenType, Token } from '~/models/schemas/token.schema'
import { SettingType } from '~/models/schemas/setting.schema'
import { AuditAction } from '~/models/schemas/auditLog.schema'
import { TransactionStatus } from '~/models/schemas/transaction.schema'
import { comparePassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/token.utils'
import { envConfig } from '~/config/env'
import redisClient from '~/config/redis'
import { logger } from '~/loggers/my-logger.log'
import { TokenPayload } from '~/models/requests/user.requests'
import { BillStatus } from '~/models/schemas/bill.schema'
import { PaginationUtils } from '~/utils/pagination.utils'
import { PaginationQuery } from '~/models/interfaces/pagination.interface'
import { UserVerificationStatus } from '~/models/schemas/user.schema'
import { BulkUserOperationResult } from '~/models/requests/admin.requests'

interface AdminTokenPayload extends TokenPayload {
  adminId: string
}

interface BulkCategoryOperationResult {
  success: string[]
  failed: Array<{ categoryId: string; reason: string }>
  total: number
  successCount: number
  failedCount: number
}

interface BulkBillOperationResult {
  success: string[]
  failed: Array<{ billId: string; reason: string }>
  total: number
  successCount: number
  failedCount: number
}

const DEFAULT_ACCESS_TOKEN_EXPIRES_IN = 3600 // 1 hour in seconds
const DEFAULT_REFRESH_TOKEN_EXPIRES_IN = 604800 // 7 days in seconds
const MAX_REFRESH_TOKEN_EXPIRES_IN = 2592000 // 30 days in seconds

class AdminService {
  private getAccessTokenExpiresIn(): number {
    const configValue = envConfig.accessTokenExpiresIn
    if (typeof configValue === 'string') {
      const parsed = parseInt(configValue)
      return isNaN(parsed) ? DEFAULT_ACCESS_TOKEN_EXPIRES_IN : parsed
    }
    return configValue || DEFAULT_ACCESS_TOKEN_EXPIRES_IN
  }

  private getRefreshTokenExpiresIn(): number {
    const configValue = envConfig.refreshTokenExpiresIn
    if (typeof configValue === 'string') {
      const parsed = parseInt(configValue)
      return isNaN(parsed) ? DEFAULT_REFRESH_TOKEN_EXPIRES_IN : Math.min(parsed, MAX_REFRESH_TOKEN_EXPIRES_IN)
    }
    return configValue ? Math.min(configValue, MAX_REFRESH_TOKEN_EXPIRES_IN) : DEFAULT_REFRESH_TOKEN_EXPIRES_IN
  }

  private signAccessToken({ adminId, role }: { adminId: string; role: string }) {
    return signToken({
      payload: {
        adminId,
        tokenType: TokenType.AccessToken,
        role
      },
      privateKey: envConfig.jwtSecretAccessToken,
      options: {
        expiresIn: this.getAccessTokenExpiresIn()
      }
    })
  }

  private signRefreshToken({ adminId, role, exp }: { adminId: string; role: string; exp?: number }) {
    const maxExp = this.getRefreshTokenExpiresIn()

    if (exp) {
      // Ensure exp doesn't exceed maximum allowed time
      const validExp = Math.min(exp, maxExp)
      return signToken({
        payload: {
          adminId,
          tokenType: TokenType.RefreshToken,
          role,
          exp
        },
        privateKey: envConfig.jwtSecretRefreshToken,
        options: {
          expiresIn: validExp
        }
      })
    }
    return signToken({
      payload: {
        adminId,
        tokenType: TokenType.RefreshToken,
        role
      },
      privateKey: envConfig.jwtSecretRefreshToken,
      options: {
        expiresIn: maxExp
      }
    })
  }

  async decodeRefreshToken(refreshToken: string) {
    const decoded = (await verifyToken({
      token: refreshToken,
      secretOrPublickey: envConfig.jwtSecretRefreshToken
    })) as AdminTokenPayload
    return {
      adminId: decoded.adminId,
      role: decoded.role,
      exp: decoded.exp as number
    }
  }

  async signAccessAndRefreshToken({ adminId, role }: { adminId: string; role: string }) {
    return Promise.all([this.signAccessToken({ adminId, role }), this.signRefreshToken({ adminId, role })])
  }

  // Authentication
  async login(loginData: AdminLoginReqBody) {
    const admin = await databaseServices.admins.findOne({ email: loginData.email })
    if (!admin) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.INVALID_CREDENTIALS,
        status: httpStatusCode.UNAUTHORIZED
      })
    }

    const isPasswordValid = await comparePassword(loginData.password, admin.password)
    if (!isPasswordValid) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.INVALID_CREDENTIALS,
        status: httpStatusCode.UNAUTHORIZED
      })
    }

    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken({
      adminId: admin._id.toString(),
      role: admin.role
    })

    // Delete existing refresh tokens
    await databaseServices.tokens.deleteMany({
      adminId: new ObjectId(admin._id),
      type: TokenType.RefreshToken
    })

    // Store new refresh token
    const { exp } = await this.decodeRefreshToken(refreshToken)
    await databaseServices.tokens.insertOne(
      new Token({
        adminId: new ObjectId(admin._id),
        token: refreshToken,
        type: TokenType.RefreshToken,
        expiresAt: new Date(exp * 1000)
      })
    )

    // Log login activity
    await databaseServices.auditLogs.insertOne({
      action: AuditAction.Login,
      adminId: admin._id,
      details: { method: 'email' },
      createdAt: new Date()
    })

    // Cache admin data
    const redis = await redisClient
    await redis.setObject(
      `admin:${admin._id.toString()}`,
      {
        _id: admin._id,
        email: admin.email,
        role: admin.role
      },
      1800
    )

    return {
      accessToken,
      refreshToken,
      admin: {
        _id: admin._id,
        email: admin.email,
        role: admin.role
      }
    }
  }

  async logout({ adminId, refreshToken }: { adminId: string; refreshToken: string }) {
    logger.info('Admin logging out', 'AdminService.logout', '', { adminId })

    const redis = await redisClient
    const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60 // 30 days in seconds

    try {
      const blacklistKey = `blacklist:token:${refreshToken}`
      const result = await redis.setObject(
        blacklistKey,
        {
          token: refreshToken,
          adminId,
          type: TokenType.RefreshToken,
          blacklistedAt: new Date().toISOString()
        },
        THIRTY_DAYS_IN_SECONDS
      )

      if (!result) {
        throw new Error('Failed to set blacklist in Redis')
      }

      logger.info('Refresh token blacklisted successfully', 'AdminService.logout', '', {
        adminId,
        blacklistKey
      })
    } catch (error) {
      logger.error('Failed to blacklist refresh token', 'AdminService.logout', '', {
        adminId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw new ErrorWithStatus({
        status: httpStatusCode.INTERNAL_SERVER_ERROR,
        message: ADMIN_MESSAGES.INTERNAL_SERVER_ERROR
      })
    }

    // Remove admin from Redis cache
    await redis.del(`admin:${adminId}`)

    const result = await Promise.all([
      databaseServices.tokens.deleteOne({
        adminId: new ObjectId(adminId),
        token: refreshToken,
        type: TokenType.RefreshToken
      }),
      databaseServices.admins.updateOne(
        { _id: new ObjectId(adminId) },
        {
          $set: {
            lastLoginTime: new Date()
          }
        }
      )
    ])

    // Log logout activity
    await databaseServices.auditLogs.insertOne({
      action: AuditAction.Logout,
      adminId: new ObjectId(adminId),
      details: { method: 'manual' },
      createdAt: new Date()
    })

    logger.info('Admin logged out successfully', 'AdminService.logout', '', { adminId })

    return {
      success: result.every((r) => r.acknowledged)
    }
  }

  async refreshToken({ adminId, role, refreshToken }: { adminId: string; role: string; refreshToken: string }) {
    logger.info('Refreshing admin token', 'AdminService.refreshToken', '', { adminId })

    const admin = await databaseServices.admins.findOne({ _id: new ObjectId(adminId) })
    if (!admin) {
      logger.error('Admin not found during token refresh', 'AdminService.refreshToken', '', { adminId })
      throw new ErrorWithStatus({
        status: httpStatusCode.NOT_FOUND,
        message: ADMIN_MESSAGES.INVALID_CREDENTIALS
      })
    }

    const token = await databaseServices.tokens.findOne({
      adminId: new ObjectId(adminId),
      token: refreshToken,
      type: TokenType.RefreshToken
    })

    if (!token) {
      logger.error('Token not found during refresh', 'AdminService.refreshToken', '', { adminId })
      throw new ErrorWithStatus({
        status: httpStatusCode.UNAUTHORIZED,
        message: ADMIN_MESSAGES.INVALID_CREDENTIALS
      })
    }

    const { exp: expRefreshToken } = await this.decodeRefreshToken(refreshToken)

    if (expRefreshToken && expRefreshToken < Date.now() / 1000) {
      logger.error('Token expired during refresh', 'AdminService.refreshToken', '', {
        adminId,
        expiry: new Date(expRefreshToken * 1000).toISOString()
      })
      throw new ErrorWithStatus({
        status: httpStatusCode.UNAUTHORIZED,
        message: ADMIN_MESSAGES.INVALID_CREDENTIALS
      })
    }

    // Blacklist old refresh token
    const redis = await redisClient
    const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60

    try {
      const blacklistKey = `blacklist:token:${refreshToken}`
      const result = await redis.setObject(
        blacklistKey,
        {
          token: refreshToken,
          adminId,
          type: TokenType.RefreshToken,
          blacklistedAt: new Date().toISOString()
        },
        THIRTY_DAYS_IN_SECONDS
      )

      if (!result) {
        throw new Error('Failed to set blacklist in Redis')
      }

      logger.info('Old refresh token blacklisted successfully', 'AdminService.refreshToken', '', {
        adminId,
        blacklistKey
      })
    } catch (error) {
      logger.error('Failed to blacklist old refresh token', 'AdminService.refreshToken', '', {
        adminId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw new ErrorWithStatus({
        status: httpStatusCode.INTERNAL_SERVER_ERROR,
        message: ADMIN_MESSAGES.INTERNAL_SERVER_ERROR
      })
    }

    // Delete old refresh token
    await databaseServices.tokens.deleteOne({ _id: token._id })

    // Generate new tokens
    const [accessToken, newRefreshToken] = await this.signAccessAndRefreshToken({
      adminId,
      role
    })

    const { exp: newExpRefreshToken } = await this.decodeRefreshToken(newRefreshToken)

    // Store new refresh token
    await databaseServices.tokens.insertOne(
      new Token({
        adminId: new ObjectId(adminId),
        token: newRefreshToken,
        type: TokenType.RefreshToken,
        expiresAt: new Date(newExpRefreshToken * 1000)
      })
    )

    // Update admin in Redis cache
    await redis.setObject(
      `admin:${adminId}`,
      {
        _id: admin._id,
        email: admin.email,
        role: admin.role
      },
      1800
    )

    logger.info('Admin token refreshed successfully', 'AdminService.refreshToken', '', { adminId })

    return {
      accessToken,
      refreshToken: newRefreshToken,
      admin: {
        _id: admin._id,
        email: admin.email,
        role: admin.role
      }
    }
  }

  // User Management
  async getAllUsers(paginationQuery: PaginationQuery & { verify?: string; search?: string }) {
    const query: Record<string, any> = {}

    if (paginationQuery.verify) {
      if (paginationQuery.verify.toLowerCase() === 'verify' || paginationQuery.verify.toLowerCase() === 'verified') {
        query.verify = UserVerificationStatus.Verified
      } else if (
        paginationQuery.verify.toLowerCase() === 'unverify' ||
        paginationQuery.verify.toLowerCase() === 'unverified'
      ) {
        query.verify = UserVerificationStatus.Unverified
      } else {
        query.verify = paginationQuery.verify
      }
    }

    if (paginationQuery.search) {
      query.$or = [
        { email: { $regex: paginationQuery.search, $options: 'i' } },
        { username: { $regex: paginationQuery.search, $options: 'i' } },
        { phone: { $regex: paginationQuery.search, $options: 'i' } }
      ]
    }

    const { items, pagination } = await PaginationUtils.paginate(
      databaseServices.users,
      query,
      { sort: { createdAt: -1 } },
      paginationQuery
    )

    return { items, pagination }
  }

  async getUserById(userId: string) {
    const user = await databaseServices.users.findOne({ _id: new ObjectId(userId) })
    if (!user) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.USER_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }
    return user
  }

  async updateUserStatus(userId: string, verify: UserVerificationStatus) {
    const result = await databaseServices.users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { verify, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.USER_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    // Log the action
    await databaseServices.auditLogs.insertOne({
      action: AuditAction.Update,
      adminId: new ObjectId(userId),
      details: { verify },
      createdAt: new Date()
    })

    return {
      success: true,
      message: ADMIN_MESSAGES.USER_STATUS_UPDATED
    }
  }

  async deleteUser(userId: string) {
    const user = await databaseServices.users.findOne({ _id: new ObjectId(userId) })
    if (!user) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.USER_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    await databaseServices.users.deleteOne({ _id: new ObjectId(userId) })

    // Log user deletion
    await databaseServices.auditLogs.insertOne({
      action: AuditAction.Delete,
      adminId: new ObjectId(userId),
      details: { userId },
      createdAt: new Date()
    })
  }

  async bulkUpdateUserStatus(userIds: string[], verify: 'verified' | 'unverified'): Promise<BulkUserOperationResult> {
    console.log('BODY:', userIds)

    if (!userIds || userIds.length === 0) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.NO_USERS_TO_UPDATE,
        status: httpStatusCode.BAD_REQUEST
      })
    }
    const validUserIds = userIds.filter((id) => ObjectId.isValid(id))
    if (validUserIds.length !== userIds.length) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.INVALID_USER_IDS,
        status: httpStatusCode.BAD_REQUEST
      })
    }
    const result: BulkUserOperationResult = {
      success: [],
      failed: [],
      total: userIds.length,
      successCount: 0,
      failedCount: 0
    }
    for (const userId of userIds) {
      try {
        const updateRes = await databaseServices.users.updateOne(
          { _id: new ObjectId(userId) },
          {
            $set: {
              verify: verify === 'verified' ? UserVerificationStatus.Verified : UserVerificationStatus.Unverified,
              updatedAt: new Date()
            }
          }
        )
        if (updateRes.matchedCount === 0) {
          result.failed.push({ userId, reason: ADMIN_MESSAGES.USER_NOT_FOUND })
          result.failedCount++
          continue
        }
        result.success.push(userId)
        result.successCount++
      } catch (error) {
        result.failed.push({ userId, reason: error instanceof Error ? error.message : 'Unknown error' })
        result.failedCount++
      }
    }
    return result
  }

  async bulkDeleteUsers(userIds: string[]): Promise<BulkUserOperationResult> {
    if (!userIds || userIds.length === 0) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.NO_USERS_TO_DELETE,
        status: httpStatusCode.BAD_REQUEST
      })
    }
    const validUserIds = userIds.filter((id) => ObjectId.isValid(id))
    if (validUserIds.length !== userIds.length) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.INVALID_USER_IDS,
        status: httpStatusCode.BAD_REQUEST
      })
    }
    const result: BulkUserOperationResult = {
      success: [],
      failed: [],
      total: userIds.length,
      successCount: 0,
      failedCount: 0
    }
    for (const userId of userIds) {
      try {
        const deleteRes = await databaseServices.users.deleteOne({ _id: new ObjectId(userId) })
        if (deleteRes.deletedCount === 0) {
          result.failed.push({ userId, reason: ADMIN_MESSAGES.USER_NOT_FOUND })
          result.failedCount++
          continue
        }
        result.success.push(userId)
        result.successCount++
      } catch (error) {
        result.failed.push({ userId, reason: error instanceof Error ? error.message : 'Unknown error' })
        result.failedCount++
      }
    }
    return result
  }

  // Financial Management
  async getFinancialOverview() {
    const [totalRevenue, monthlyRevenue, recentTransactions] = await Promise.all([
      databaseServices.transactions
        .aggregate([
          { $match: { status: TransactionStatus.Completed } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
        .toArray(),
      databaseServices.transactions
        .aggregate([
          {
            $match: {
              status: TransactionStatus.Completed,
              createdAt: { $gte: new Date(new Date().setDate(1)) }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
        .toArray(),
      databaseServices.transactions
        .find({ status: TransactionStatus.Completed })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray()
    ])

    return {
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      transactions: recentTransactions
    }
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettingsReqBody> {
    const settings = await databaseServices.settings.findOne({ type: SettingType.System })
    if (!settings) {
      return {
        maxGroupsPerUser: 100,
        defaultCurrency: 'VND',
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireNumber: true
        },
        notifications: {
          enable: true,
          email: true,
          sms: false
        }
      }
    }
    return settings.data as SystemSettingsReqBody
  }

  async updateSystemSettings(settings: SystemSettingsReqBody) {
    await databaseServices.settings.updateOne(
      { type: SettingType.System },
      { $set: { data: settings, updatedAt: new Date() } },
      { upsert: true }
    )

    // Log the action
    await databaseServices.auditLogs.insertOne({
      action: AuditAction.Update,
      details: { type: 'system_settings', settings },
      createdAt: new Date()
    })

    return { success: true }
  }

  // Notifications
  async getAllNotifications(paginationQuery: PaginationQuery) {
    return PaginationUtils.paginate(databaseServices.notifications, {}, { sort: { createdAt: -1 } }, paginationQuery)
  }

  async markNotificationAsRead(notificationId: string) {
    const result = await databaseServices.notifications.updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { read: true, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.NOTIFICATION_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    return { success: true }
  }

  // Project Management
  async getProjectInfo() {
    const [totalUsers, totalGroups, totalTransactions] = await Promise.all([
      databaseServices.users.countDocuments({}),
      databaseServices.groups.countDocuments({}),
      databaseServices.transactions.countDocuments({})
    ])

    return {
      totalUsers,
      totalGroups,
      totalTransactions,
      activeFeatures: ['shoppingList', 'billSplit', 'debtTracker'],
      systemStatus: 'healthy'
    }
  }

  async updateProjectStatus(status: ProjectStatusReqBody) {
    await databaseServices.settings.updateOne(
      { type: SettingType.System },
      {
        $set: { 'data.systemStatus': status.systemStatus, 'data.statusMessage': status.message, updatedAt: new Date() }
      },
      { upsert: true }
    )

    // Log the action
    await databaseServices.auditLogs.insertOne({
      action: AuditAction.Update,
      details: { type: 'project_status', status },
      createdAt: new Date()
    })

    return { success: true }
  }

  async createSystemBackup() {
    // TODO: Implement actual backup logic
    const backupId = `backup_${Date.now()}`

    // Log the action
    await databaseServices.auditLogs.insertOne({
      action: AuditAction.Create,
      details: { type: 'system_backup', backupId },
      createdAt: new Date()
    })

    return { backupId }
  }

  // System Monitoring
  async getSystemPerformance() {
    // TODO: Implement actual system monitoring
    return {
      cpuUsage: '45%',
      memoryUsage: '70%',
      diskUsage: '30%',
      responseTime: '250ms',
      requestsPerSecond: 300
    }
  }

  async getSystemErrors() {
    const errors = await databaseServices.errorLogs.find({}).sort({ occurredAt: -1 }).limit(100).toArray()
    return errors
  }

  async getFeatureUsage() {
    // TODO: Implement actual feature usage tracking
    return {
      shoppingList: {
        totalUsage: 1200,
        dailyActiveUsers: 250
      },
      billSplit: {
        totalUsage: 950,
        dailyActiveUsers: 200
      },
      debtTracker: {
        totalUsage: 700,
        dailyActiveUsers: 150
      }
    }
  }

  // Transaction Management
  async getTransactionHistory(
    paginationQuery: PaginationQuery & { startDate?: string; endDate?: string; type?: string; status?: string }
  ) {
    const query: Record<string, any> = {}

    if (paginationQuery.startDate || paginationQuery.endDate) {
      query.createdAt = {}
      if (paginationQuery.startDate) query.createdAt.$gte = new Date(paginationQuery.startDate)
      if (paginationQuery.endDate) query.createdAt.$lte = new Date(paginationQuery.endDate)
    }

    if (paginationQuery.type) query.type = paginationQuery.type
    if (paginationQuery.status) query.status = paginationQuery.status

    return PaginationUtils.paginate(databaseServices.transactions, query, { sort: { createdAt: -1 } }, paginationQuery)
  }

  // Dashboard Statistics
  async getDashboardStats() {
    const [totalUsers, activeUsers, totalTransactions] = await Promise.all([
      databaseServices.users.countDocuments({}),
      databaseServices.users.countDocuments({ lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      databaseServices.transactions.countDocuments({})
    ])

    const recentActivitiesPaginated = await PaginationUtils.paginate(
      databaseServices.auditLogs,
      {},
      { sort: { createdAt: -1 } },
      {
        page: 1,
        limit: 20
      }
    )

    return {
      totalUsers,
      activeUsers,
      totalTransactions,
      recentActivities: recentActivitiesPaginated.items
    }
  }

  // Audit Logs
  async getAuditLogs(paginationQuery: PaginationQuery & { action?: string; userId?: string; adminId?: string }) {
    const query: Record<string, any> = {}

    if (paginationQuery.action) query.action = paginationQuery.action
    if (paginationQuery.userId) query.userId = new ObjectId(paginationQuery.userId)
    if (paginationQuery.adminId) query.adminId = new ObjectId(paginationQuery.adminId)

    return PaginationUtils.paginate(databaseServices.auditLogs, query, { sort: { createdAt: -1 } }, paginationQuery)
  }

  // Category Management
  async getAllCategories(
    paginationQuery: PaginationQuery & { search?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }
  ) {
    const query: Record<string, any> = {}
    if (paginationQuery.search) {
      query.$or = [
        { name: { $regex: paginationQuery.search, $options: 'i' } },
        { description: { $regex: paginationQuery.search, $options: 'i' } }
      ]
    }
    let sort: Record<string, 1 | -1> = { createdAt: -1 }
    if (paginationQuery.sortBy) {
      const order = paginationQuery.sortOrder === 'ASC' ? 1 : -1
      sort = { [paginationQuery.sortBy]: order }
    }
    return PaginationUtils.paginate(databaseServices.categories, query, { sort }, paginationQuery)
  }

  async createCategory(data: { name: string; description?: string }) {
    const result = await databaseServices.categories.insertOne({
      name: data.name,
      description: data.description,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return { categoryId: result.insertedId }
  }

  async updateCategory(categoryId: string, data: { name?: string; description?: string }) {
    const category = await databaseServices.categories.findOne({ _id: new ObjectId(categoryId) })
    if (!category) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.CATEGORY_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    await databaseServices.categories.updateOne(
      { _id: new ObjectId(categoryId) },
      {
        $set: {
          ...(data.name && { name: data.name }),
          ...(data.description && { description: data.description }),
          updatedAt: new Date()
        }
      }
    )

    return { categoryId }
  }

  async bulkDeleteCategories(categoryIds: string[]): Promise<BulkCategoryOperationResult> {
    if (!categoryIds || categoryIds.length === 0) {
      throw new ErrorWithStatus({
        message: 'No categories to delete',
        status: httpStatusCode.BAD_REQUEST
      })
    }
    const result: BulkCategoryOperationResult = {
      success: [],
      failed: [],
      total: categoryIds.length,
      successCount: 0,
      failedCount: 0
    }
    for (const categoryId of categoryIds) {
      try {
        const category = await databaseServices.categories.findOne({ _id: new ObjectId(categoryId) })
        if (!category) {
          result.failed.push({ categoryId, reason: 'Category not found' })
          result.failedCount++
          continue
        }
        await databaseServices.categories.deleteOne({ _id: new ObjectId(categoryId) })
        result.success.push(categoryId)
        result.successCount++
      } catch (error) {
        result.failed.push({ categoryId, reason: error instanceof Error ? error.message : 'Unknown error' })
        result.failedCount++
      }
    }
    return result
  }

  // Bill Management
  async getAllBills(
    paginationQuery: PaginationQuery & {
      search?: string
      groupId?: string
      status?: string
      startDate?: Date
      endDate?: Date
      minAmount?: number
      maxAmount?: number
      sortBy?: string
      sortOrder?: 'ASC' | 'DESC'
    }
  ) {
    const query: Record<string, any> = {}
    if (paginationQuery.search) {
      query.$or = [
        { title: { $regex: paginationQuery.search, $options: 'i' } },
        { description: { $regex: paginationQuery.search, $options: 'i' } }
      ]
    }
    if (paginationQuery.groupId) {
      query.groupId = new ObjectId(paginationQuery.groupId)
    }
    if (paginationQuery.status) {
      query.status = paginationQuery.status
    }
    if (paginationQuery.startDate || paginationQuery.endDate) {
      query.createdAt = {}
      if (paginationQuery.startDate) query.createdAt.$gte = new Date(paginationQuery.startDate)
      if (paginationQuery.endDate) query.createdAt.$lte = new Date(paginationQuery.endDate)
    }
    if (paginationQuery.minAmount || paginationQuery.maxAmount) {
      query.amount = {}
      if (paginationQuery.minAmount) query.amount.$gte = paginationQuery.minAmount
      if (paginationQuery.maxAmount) query.amount.$lte = paginationQuery.maxAmount
    }
    let sort: Record<string, 1 | -1> = { createdAt: -1 }
    if (paginationQuery.sortBy) {
      const order = paginationQuery.sortOrder === 'ASC' ? 1 : -1
      sort = { [paginationQuery.sortBy]: order }
    }
    return PaginationUtils.paginate(databaseServices.bills, query, { sort }, paginationQuery)
  }

  async getBillById(billId: string) {
    const bill = await databaseServices.bills.findOne({ _id: new ObjectId(billId) })
    if (!bill) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.BILL_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    return bill
  }

  async updateBillStatus(billId: string, status: string) {
    const bill = await databaseServices.bills.findOne({ _id: new ObjectId(billId) })
    if (!bill) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.BILL_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    await databaseServices.bills.updateOne(
      { _id: new ObjectId(billId) },
      {
        $set: {
          status: status as unknown as BillStatus,
          updatedAt: new Date()
        }
      }
    )

    return { billId }
  }

  async deleteBill(billId: string) {
    const bill = await databaseServices.bills.findOne({ _id: new ObjectId(billId) })
    if (!bill) {
      throw new ErrorWithStatus({
        message: ADMIN_MESSAGES.BILL_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    await databaseServices.bills.deleteOne({ _id: new ObjectId(billId) })
  }

  async bulkDeleteBills(billIds: string[]): Promise<BulkBillOperationResult> {
    if (!billIds || billIds.length === 0) {
      throw new ErrorWithStatus({
        message: 'No bills to delete',
        status: httpStatusCode.BAD_REQUEST
      })
    }
    const result: BulkBillOperationResult = {
      success: [],
      failed: [],
      total: billIds.length,
      successCount: 0,
      failedCount: 0
    }
    for (const billId of billIds) {
      try {
        const bill = await databaseServices.bills.findOne({ _id: new ObjectId(billId) })
        if (!bill) {
          result.failed.push({ billId, reason: 'Bill not found' })
          result.failedCount++
          continue
        }
        await databaseServices.bills.deleteOne({ _id: new ObjectId(billId) })
        result.success.push(billId)
        result.successCount++
      } catch (error) {
        result.failed.push({ billId, reason: error instanceof Error ? error.message : 'Unknown error' })
        result.failedCount++
      }
    }
    return result
  }
}

export default new AdminService()
