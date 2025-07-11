import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { httpStatusCode } from '~/core/httpStatusCode'
import { OK } from '~/core/succes.response'
import { ADMIN_MESSAGES } from '~/constants/messages'
import adminService from '~/services/admin.service'
import {
  AdminLoginReqBody,
  SystemSettingsReqBody,
  ProjectStatusReqBody,
  NotificationMarkReadReqBody,
  TransactionFilterReqQuery,
  GetAllUsersReqQuery,
  BulkUpdateUserStatusReqBody,
  BulkDeleteUsersReqBody,
  BulkDeleteCategoriesReqBody,
  BulkDeleteBillsReqBody
} from '~/models/requests/admin.requests'
import { AdminTokenPayload } from '~/models/requests/admin.requests'

class AdminController {
  // Health Check
  async healthStatusGET(req: Request, res: Response) {
    return new OK({
      message: 'Admin API is working'
    }).send(res)
  }

  // Authentication
  async login(req: Request<ParamsDictionary, unknown, AdminLoginReqBody>, res: Response) {
    const result = await adminService.login(req.body)
    return new OK({
      message: ADMIN_MESSAGES.LOGIN_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async logout(req: Request, res: Response) {
    const { refreshToken } = req.body
    const { adminId } = req.decodedAuthorization as AdminTokenPayload
    const result = await adminService.logout({ adminId, refreshToken })
    return new OK({
      message: ADMIN_MESSAGES.LOGOUT_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body
    const { adminId, role } = req.decodedRefreshToken as AdminTokenPayload
    const result = await adminService.refreshToken({ adminId, role, refreshToken })
    return new OK({
      message: ADMIN_MESSAGES.REFRESH_TOKEN_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  // System Settings
  async getSystemSettings(req: Request, res: Response) {
    const settings = await adminService.getSystemSettings()
    return new OK({
      data: { settings }
    }).send(res)
  }

  async updateSystemSettings(req: Request<ParamsDictionary, unknown, SystemSettingsReqBody>, res: Response) {
    await adminService.updateSystemSettings(req.body)
    return new OK({
      message: ADMIN_MESSAGES.SETTINGS_UPDATED_SUCCESSFULLY
    }).send(res)
  }

  // Notifications
  async getAllNotifications(req: Request, res: Response) {
    const { page = 1, limit = 10 } = req.query
    const notifications = await adminService.getAllNotifications({
      page: Number(page),
      limit: Number(limit)
    })
    return new OK({
      data: { notifications }
    }).send(res)
  }

  async markNotificationAsRead(req: Request<ParamsDictionary, unknown, NotificationMarkReadReqBody>, res: Response) {
    const { notificationId } = req.body
    await adminService.markNotificationAsRead(notificationId)
    return new OK({
      message: ADMIN_MESSAGES.NOTIFICATION_MARKED_AS_READ
    }).send(res)
  }

  // Project Management
  async getProjectInfo(req: Request, res: Response) {
    const projectInfo = await adminService.getProjectInfo()
    return new OK({
      data: { project: projectInfo }
    }).send(res)
  }

  async updateProjectStatus(req: Request<ParamsDictionary, unknown, ProjectStatusReqBody>, res: Response) {
    await adminService.updateProjectStatus(req.body)
    return new OK({
      message: ADMIN_MESSAGES.PROJECT_STATUS_UPDATED
    }).send(res)
  }

  async createSystemBackup(req: Request, res: Response) {
    const result = await adminService.createSystemBackup()
    return new OK({
      message: ADMIN_MESSAGES.BACKUP_CREATED_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  // System Monitoring
  async getSystemPerformance(req: Request, res: Response) {
    const performance = await adminService.getSystemPerformance()
    return new OK({
      data: { performance }
    }).send(res)
  }

  async getSystemErrors(req: Request, res: Response) {
    const errors = await adminService.getSystemErrors()
    return new OK({
      data: { errors }
    }).send(res)
  }

  async getFeatureUsage(req: Request, res: Response) {
    const usage = await adminService.getFeatureUsage()
    return new OK({
      data: { usage }
    }).send(res)
  }

  // Transaction Management
  async getAllTransactions(req: Request<ParamsDictionary, unknown, unknown, TransactionFilterReqQuery>, res: Response) {
    const { page = 1, limit = 10, startDate, endDate, type, status } = req.query
    const transactions = await adminService.getTransactionHistory({
      page: Number(page),
      limit: Number(limit),
      startDate,
      endDate,
      type,
      status
    })
    return new OK({
      data: { transactions }
    }).send(res)
  }

  // Dashboard
  async adminDashboardGET(req: Request, res: Response) {
    const stats = await adminService.getDashboardStats()
    return new OK({
      message: ADMIN_MESSAGES.DASHBOARD_STATS_FETCHED_SUCCESSFULLY,
      data: stats
    }).send(res)
  }

  // User Management
  async getAllUsers(req: Request<ParamsDictionary, unknown, unknown, GetAllUsersReqQuery>, res: Response) {
    const { verify, search, ...paginationQuery } = req.query
    const result = await adminService.getAllUsers({
      ...paginationQuery,
      verify: verify as string,
      search: search as string
    })
    new OK({
      message: 'Get all user successfully',
      data: {
        users: result.items,
        pagination: result.pagination
      }
    }).send(res)
  }

  async getUserById(req: Request, res: Response) {
    const { userId } = req.params
    const user = await adminService.getUserById(userId)
    return new OK({
      message: 'Get user by id successfully',
      data: { user }
    }).send(res)
  }

  async updateUserStatus(req: Request, res: Response) {
    const { userId } = req.params
    const { verify } = req.body
    const result = await adminService.updateUserStatus(userId, verify)
    return new OK({
      message: result.message
    }).send(res)
  }

  async deleteUser(req: Request, res: Response) {
    const { userId } = req.params
    await adminService.deleteUser(userId)
    return new OK({
      message: ADMIN_MESSAGES.USER_DELETED_SUCCESSFULLY
    }).send(res)
  }

  async bulkUpdateUserStatus(req: Request<ParamsDictionary, any, BulkUpdateUserStatusReqBody>, res: Response) {
    const { userIds, verify } = req.body
    console.log(userIds)
    const result = await adminService.bulkUpdateUserStatus(userIds, verify)
    return new OK({
      message: ADMIN_MESSAGES.USER_STATUS_UPDATED,
      data: result
    }).send(res)
  }

  async bulkDeleteUsers(req: Request<ParamsDictionary, any, BulkDeleteUsersReqBody>, res: Response) {
    const { userIds } = req.body
    const result = await adminService.bulkDeleteUsers(userIds)
    return new OK({
      message: ADMIN_MESSAGES.USER_DELETED_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  // Financial Management
  async getFinancialOverview(req: Request, res: Response) {
    const overview = await adminService.getFinancialOverview()
    return new OK({
      data: overview
    }).send(res)
  }

  // Category Management
  async getAllCategories(req: Request, res: Response) {
    const { page, limit, search, sortBy, sortOrder } = req.query
    const result = await adminService.getAllCategories({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as 'ASC' | 'DESC') || 'DESC'
    })
    return new OK({
      message: 'Get all category successfully',
      data: {
        categories: result.items,
        pagination: result.pagination
      }
    }).send(res)
  }

  async createCategory(req: Request, res: Response) {
    const result = await adminService.createCategory(req.body)
    return new OK({
      message: ADMIN_MESSAGES.CATEGORY_CREATED_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async updateCategory(req: Request, res: Response) {
    const { categoryId } = req.params
    const result = await adminService.updateCategory(categoryId, req.body)
    return new OK({
      message: ADMIN_MESSAGES.CATEGORY_UPDATED_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async bulkDeleteCategories(req: Request<ParamsDictionary, any, BulkDeleteCategoriesReqBody>, res: Response) {
    const { categoryIds } = req.body
    const result = await adminService.bulkDeleteCategories(categoryIds)
    return new OK({
      message: 'Bulk delete categories completed',
      data: result
    }).send(res)
  }

  // Bill Management
  async getAllBills(req: Request, res: Response) {
    const { page, limit, search, groupId, status, startDate, endDate, minAmount, maxAmount, sortBy, sortOrder } =
      req.query
    const result = await adminService.getAllBills({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search: search as string,
      groupId: groupId as string,
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      minAmount: minAmount ? Number(minAmount) : undefined,
      maxAmount: maxAmount ? Number(maxAmount) : undefined,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as 'ASC' | 'DESC') || 'DESC'
    })
    return new OK({
      message: 'Get all bill successfully',
      data: {
        bills: result.items,
        pagination: result.pagination
      }
    }).send(res)
  }

  async getBillById(req: Request, res: Response) {
    const { billId } = req.params
    const bill = await adminService.getBillById(billId)
    return new OK({
      data: { bill }
    }).send(res)
  }

  async updateBillStatus(req: Request, res: Response) {
    const { billId } = req.params
    const { status } = req.body
    const result = await adminService.updateBillStatus(billId, status)
    return new OK({
      message: ADMIN_MESSAGES.BILL_STATUS_UPDATED_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async deleteBill(req: Request, res: Response) {
    const { billId } = req.params
    await adminService.deleteBill(billId)
    return new OK({
      message: ADMIN_MESSAGES.BILL_DELETED_SUCCESSFULLY
    }).send(res)
  }

  async bulkDeleteBills(req: Request<ParamsDictionary, any, BulkDeleteBillsReqBody>, res: Response) {
    const { billIds } = req.body
    const result = await adminService.bulkDeleteBills(billIds)
    return new OK({
      message: 'Bulk delete bills completed',
      data: result
    }).send(res)
  }
}

export default new AdminController()
