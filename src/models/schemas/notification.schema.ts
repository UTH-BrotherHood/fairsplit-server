import { ObjectId } from 'mongodb'

export interface INotification {
  _id?: ObjectId
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
  userId?: ObjectId
  adminId?: ObjectId
  metadata?: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
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
  metadata?: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
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
