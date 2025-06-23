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
