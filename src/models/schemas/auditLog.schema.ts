import { ObjectId } from 'mongodb'
import envConfig from '~/config/env'

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
  details: Record<string, any>
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
  details: Record<string, any>
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

export const AuditLogModel = {
  collectionName: envConfig.dbAuditLogCollection,
  jsonSchema: {
    bsonType: 'object',
    required: ['action', 'details'],
    properties: {
      _id: { bsonType: 'objectId' },
      action: { bsonType: 'string', enum: Object.values(AuditAction) },
      userId: { bsonType: 'objectId' },
      adminId: { bsonType: 'objectId' },
      details: { bsonType: 'object' },
      ipAddress: { bsonType: 'string' },
      userAgent: { bsonType: 'string' },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' }
    }
  },
  indexes: [{ key: { createdAt: -1 } }, { key: { userId: 1 } }, { key: { adminId: 1 } }, { key: { action: 1 } }]
}
