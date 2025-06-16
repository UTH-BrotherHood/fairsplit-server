import { ObjectId } from 'mongodb'
import envConfig from '~/config/env'

export interface INotification {
  _id?: ObjectId
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
  userId?: ObjectId
  adminId?: ObjectId
  metadata?: Record<string, any>
  createdAt?: Date
  updatedAt?: Date
}

export class Notification implements INotification {
  _id?: ObjectId
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
  userId?: ObjectId
  adminId?: ObjectId
  metadata?: Record<string, any>
  createdAt?: Date
  updatedAt?: Date

  constructor({ title, message, type, read, userId, adminId, metadata, createdAt, updatedAt }: INotification) {
    this.title = title
    this.message = message
    this.type = type
    this.read = read
    this.userId = userId
    this.adminId = adminId
    this.metadata = metadata
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}

export const NotificationModel = {
  collectionName: envConfig.dbNotificationCollection,
  jsonSchema: {
    bsonType: 'object',
    required: ['title', 'message', 'type', 'read'],
    properties: {
      _id: { bsonType: 'objectId' },
      title: { bsonType: 'string' },
      message: { bsonType: 'string' },
      type: {
        enum: ['info', 'warning', 'error', 'success']
      },
      read: { bsonType: 'bool' },
      userId: { bsonType: 'objectId' },
      adminId: { bsonType: 'objectId' },
      metadata: { bsonType: 'object' },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' }
    }
  },
  indexes: [{ key: { createdAt: -1 } }, { key: { read: 1 } }, { key: { userId: 1 } }, { key: { adminId: 1 } }]
}
