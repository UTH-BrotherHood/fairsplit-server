import { TokenPayload } from './user.requests'

export interface AdminLoginReqBody {
  email: string
  password: string
}

export interface AdminTokenPayload extends TokenPayload {
  role: 'admin' | 'superAdmin' | 'moderator'
}

export interface SystemSettingsReqBody {
  maxGroupsPerUser: number
  defaultCurrency: string
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireNumber: boolean
  }
  notifications: {
    enable: boolean
    email: boolean
    sms: boolean
  }
}

export interface ProjectStatusReqBody {
  systemStatus: 'healthy' | 'maintenance' | 'degraded'
  message?: string
}

export interface NotificationMarkReadReqBody {
  notificationId: string
}

export interface TransactionFilterReqQuery {
  page?: string
  limit?: string
  startDate?: string
  endDate?: string
  type?: string
  status?: string
}

export interface GetAllUsersReqQuery {
  page?: string
  limit?: string
  verify?: 'verify' | 'verified' | 'unverify' | 'unverified'
  search?: string
}

export interface BulkUpdateUserStatusReqBody {
  userIds: string[]
  verify: 'verified' | 'unverified'
}

export interface BulkDeleteUsersReqBody {
  userIds: string[]
}

export interface BulkUserOperationResult {
  success: string[]
  failed: Array<{
    userId: string
    reason: string
  }>
  total: number
  successCount: number
  failedCount: number
}

export interface BulkDeleteCategoriesReqBody {
  categoryIds: string[]
}

export interface BulkDeleteBillsReqBody {
  billIds: string[]
}

export interface BulkDeleteGroupsReqBody {
  groupIds: string[]
}

export interface UpdateGroupStatusReqBody {
  status: string
}

export interface BulkDeleteShoppingListsReqBody {
  listIds: string[]
}

export interface BulkDeleteShoppingListItemsReqBody {
  itemIds: string[]
}
