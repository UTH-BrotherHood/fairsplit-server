import { ObjectId } from 'mongodb'

export enum AuditAction {
  Login = 'login',
  Logout = 'logout',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  DeleteUser = 'delete_user'
}
export interface IAuditLog {
  _id?: ObjectId
  action: AuditAction
  userId?: ObjectId
  adminId?: ObjectId
  details: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  ipAddress?: string
  userAgent?: string
  createdAt?: Date
  updatedAt?: Date
}

export class AuditLog implements IAuditLog {
  _id?: ObjectId
  action: AuditAction
  userId?: ObjectId
  adminId?: ObjectId
  details: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  ipAddress?: string
  userAgent?: string
  createdAt?: Date
  updatedAt?: Date
  constructor({ action, userId, adminId, details, ipAddress, userAgent, createdAt, updatedAt }: IAuditLog) {
    this.action = action
    this.userId = userId
    this.adminId = adminId
    this.details = details
    this.ipAddress = ipAddress
    this.userAgent = userAgent
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}
