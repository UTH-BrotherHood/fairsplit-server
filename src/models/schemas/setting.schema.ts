import { ObjectId } from 'mongodb'
import envConfig from '~/config/env'

export enum SettingType {
  System = 'system',
  User = 'user'
}

export interface ISetting {
  _id?: ObjectId
  type: SettingType
  data: Record<string, any>
  createdAt?: Date
  updatedAt?: Date
}

export class Setting implements ISetting {
  _id?: ObjectId
  type: SettingType
  data: Record<string, any>
  createdAt?: Date
  updatedAt?: Date

  constructor({ type, data, createdAt, updatedAt }: ISetting) {
    this.type = type
    this.data = data
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}

export const SettingModel = {
  collectionName: envConfig.dbSettingCollection,
  jsonSchema: {
    bsonType: 'object',
    required: ['type', 'data'],
    properties: {
      _id: { bsonType: 'objectId' },
      type: { bsonType: 'string', enum: Object.values(SettingType) },
      data: { bsonType: 'object' },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' }
    }
  },
  indexes: [{ key: { type: 1 }, unique: true }]
}
