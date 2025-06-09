import { ObjectId } from 'mongodb'
import envConfig from '~/config/env'

export enum VerificationCodeType {
  EmailVerification = 'EmailVerification',
  PhoneVerification = 'PhoneVerification',
  PasswordReset = 'PasswordReset'
}

export interface IVerificationCode {
  _id?: ObjectId
  userId: ObjectId
  code: string
  type: VerificationCodeType
  expiresAt: Date
  createdAt: Date
  isUsed: boolean
}

export class VerificationCode implements IVerificationCode {
  _id?: ObjectId
  userId: ObjectId
  code: string
  type: VerificationCodeType
  expiresAt: Date
  createdAt: Date
  isUsed: boolean

  constructor({
    userId,
    code,
    type,
    expiresAt,
    createdAt = new Date(),
    isUsed = false
  }: {
    userId: ObjectId | string
    code: string
    type: VerificationCodeType
    expiresAt: Date
    createdAt?: Date
    isUsed?: boolean
  }) {
    this.userId = typeof userId === 'string' ? new ObjectId(userId) : userId
    this.code = code
    this.type = type
    this.expiresAt = expiresAt
    this.createdAt = createdAt
    this.isUsed = isUsed
  }
}

export const VerificationCodeModel = {
  collectionName: envConfig.dbVerificationCodeCollection,
  jsonSchema: {
    bsonType: 'object',
    required: ['userId', 'code', 'type', 'expiresAt', 'createdAt', 'isUsed'],
    properties: {
      _id: { bsonType: 'objectId' },
      userId: {
        bsonType: 'objectId',
        description: 'Reference to the user this code belongs to'
      },
      code: {
        bsonType: 'string',
        minLength: 6,
        maxLength: 6,
        description: 'The verification code'
      },
      type: {
        enum: Object.values(VerificationCodeType),
        description: 'Type of the verification code'
      },
      expiresAt: {
        bsonType: 'date',
        description: 'When this code expires'
      },
      createdAt: {
        bsonType: 'date',
        description: 'When this code was created'
      },
      isUsed: {
        bsonType: 'bool',
        description: 'Whether this code has been used',
        default: false
      }
    }
  },
  indexes: [{ key: { userId: 1, type: 1 } }, { key: { code: 1 } }, { key: { expiresAt: 1 }, expireAfterSeconds: 0 }]
}
