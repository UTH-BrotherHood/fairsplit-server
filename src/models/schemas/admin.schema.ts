import { ObjectId } from 'mongodb'

export interface IAdmin {
  _id?: ObjectId
  email: string
  password: string
  role: 'admin' | 'superAdmin' | 'moderator'
  createdAt?: Date
  updatedAt?: Date
}

export class Admin implements IAdmin {
  _id?: ObjectId
  email: string
  password: string
  role: 'admin' | 'superAdmin' | 'moderator'
  createdAt?: Date
  updatedAt?: Date

  constructor({ email, password, role, createdAt, updatedAt }: IAdmin) {
    this.email = email
    this.password = password
    this.role = role
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}
