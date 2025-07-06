import { ObjectId } from 'mongodb'

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
