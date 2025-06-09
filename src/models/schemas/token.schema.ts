import { ObjectId } from 'mongodb'
import envConfig from '~/config/env'

export enum TokenType {
  AccessToken = 'AccessToken',
  RefreshToken = 'RefreshToken',
  EmailVerificationToken = 'EmailVerificationToken',
  PasswordResetToken = 'PasswordResetToken'
}

export interface IToken {
  _id?: ObjectId
  token: string
  type: TokenType
  userId?: ObjectId
  adminId?: ObjectId
  expiresAt: Date
  createdAt?: Date
  updatedAt?: Date
}

export class Token implements IToken {
  _id?: ObjectId
  token: string
  type: TokenType
  userId?: ObjectId
  adminId?: ObjectId
  expiresAt: Date
  createdAt?: Date
  updatedAt?: Date

  constructor({ token, type, userId, adminId, expiresAt, createdAt, updatedAt }: IToken) {
    this.token = token
    this.type = type
    this.userId = userId
    this.adminId = adminId
    this.expiresAt = expiresAt
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}

export const TokenModel = {
  collectionName: envConfig.dbTokenCollection,
  jsonSchema: {
    bsonType: 'object',
    required: ['token', 'type', 'expiresAt'],
    properties: {
      _id: { bsonType: 'objectId' },
      token: { bsonType: 'string' },
      type: { bsonType: 'string', enum: Object.values(TokenType) },
      userId: { bsonType: 'objectId' },
      adminId: { bsonType: 'objectId' },
      expiresAt: { bsonType: 'date' },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' }
    }
  },
  indexes: [
    { key: { token: 1 }, unique: true },
    { key: { type: 1 } },
    { key: { userId: 1 } },
    { key: { adminId: 1 } },
    { key: { expiresAt: 1 } }
  ]
}
