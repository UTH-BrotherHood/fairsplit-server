import { ObjectId } from 'mongodb'

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
