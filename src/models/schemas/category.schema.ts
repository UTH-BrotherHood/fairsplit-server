import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/env'

export interface ICategory {
  _id?: ObjectId
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export class Category implements ICategory {
  _id?: ObjectId
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date

  constructor({ name, description, createdAt, updatedAt }: ICategory) {
    this.name = name
    this.description = description
    this.createdAt = createdAt || new Date()
    this.updatedAt = updatedAt || new Date()
  }
}

export const CategoryModel = {
  collectionName: envConfig.dbCategoryCollection,
  jsonSchema: {
    bsonType: 'object',
    required: ['name', 'createdAt', 'updatedAt'],
    properties: {
      _id: { bsonType: 'objectId' },
      name: { bsonType: 'string', minLength: 1, maxLength: 100 },
      description: { bsonType: 'string', maxLength: 500 },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' }
    }
  },
  indexes: [{ key: { name: 1 }, unique: true }, { key: { createdAt: -1 } }]
}
