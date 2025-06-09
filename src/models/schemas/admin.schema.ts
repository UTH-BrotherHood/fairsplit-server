import { ObjectId } from 'mongodb'
import envConfig from '~/config/env'

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

export const AdminModel = {
  collectionName: envConfig.dbAdminCollection,
  jsonSchema: {
    bsonType: 'object',
    required: ['email', 'password', 'role'],
    properties: {
      _id: { bsonType: 'objectId' },
      email: {
        bsonType: 'string',
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
      },
      password: { bsonType: 'string' },
      role: {
        enum: ['admin', 'superAdmin', 'moderator']
      },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' }
    }
  },
  indexes: [{ key: { email: 1 }, unique: true }, { key: { role: 1 } }]
}
