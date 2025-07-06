import { ObjectId } from 'mongodb'

export enum SettingType {
  System = 'system',
  User = 'user'
}

export interface ISetting {
  _id?: ObjectId
  type: SettingType
  data: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  createdAt?: Date
  updatedAt?: Date
}

export class Setting implements ISetting {
  _id?: ObjectId
  type: SettingType
  data: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  createdAt?: Date
  updatedAt?: Date

  constructor({ type, data, createdAt, updatedAt }: ISetting) {
    this.type = type
    this.data = data
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}
