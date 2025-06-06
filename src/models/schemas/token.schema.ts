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
  userId: ObjectId
  token: string
  type: TokenType
  expiresAt: Date
  createdAt: Date
  isRevoked?: boolean
}

export class Token implements IToken {
  _id?: ObjectId
  userId: ObjectId
  token: string
  type: TokenType
  expiresAt: Date
  createdAt: Date
  isRevoked?: boolean

  constructor({
    userId,
    token,
    type,
    expiresAt,
    createdAt = new Date(),
    isRevoked = false
  }: {
    userId: ObjectId | string
    token: string
    type: TokenType
    expiresAt: Date
    createdAt?: Date
    isRevoked?: boolean
  }) {
    this.userId = typeof userId === 'string' ? new ObjectId(userId) : userId
    this.token = token
    this.type = type
    this.expiresAt = expiresAt
    this.createdAt = createdAt
    this.isRevoked = isRevoked
  }
}
export const TokenModel = {
  collectionName: envConfig.dbTokenCollection,
  jsonSchema: {
    bsonType: 'object',
    required: ['userId', 'token', 'type', 'expiresAt', 'createdAt'],
    properties: {
      _id: { bsonType: 'objectId' },
      userId: {
        bsonType: 'objectId',
        description: 'Reference to the user this token belongs to'
      },
      token: {
        bsonType: 'string',
        minLength: 32,
        description: 'The actual token string'
      },
      type: {
        enum: Object.values(TokenType),
        description: 'Type of the token'
      },
      expiresAt: {
        bsonType: 'date',
        description: 'When this token expires'
      },
      createdAt: {
        bsonType: 'date',
        description: 'When this token was created'
      },
      isRevoked: {
        bsonType: 'bool',
        description: 'Whether this token has been revoked',
        default: false
      }
    }
  },
  indexes: [
    { key: { token: 1 }, unique: true },
    { key: { userId: 1, type: 1 } },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0 }
  ]
}
