import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/env'

export enum ListStatus {
  Active = 'active',
  Completed = 'completed',
  Archived = 'archived'
}

export interface IShoppingListItem {
  _id?: ObjectId
  name: string
  quantity: number
  unit?: string
  estimatedPrice?: number
  note?: string
  isPurchased: boolean
  purchasedBy?: ObjectId
  purchasedAt?: Date
  category?: string
}

export interface IShoppingList {
  _id?: ObjectId
  groupId: ObjectId
  name: string
  description?: string
  status: ListStatus
  items: IShoppingListItem[]
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  totalEstimatedPrice?: number
  totalActualPrice?: number
  dueDate?: Date
  tags?: string[]
}

export const ShoppingListModel = {
  collectionName: envConfig.dbShoppingListCollection,
  jsonSchema: {
    bsonType: 'object',
    required: ['groupId', 'name', 'status', 'items', 'createdBy', 'createdAt', 'updatedAt'],
    properties: {
      _id: { bsonType: 'objectId' },
      groupId: { bsonType: 'objectId' },
      name: {
        bsonType: 'string',
        minLength: 1,
        maxLength: 100
      },
      description: {
        bsonType: 'string',
        maxLength: 500
      },
      status: {
        enum: Object.values(ListStatus)
      },
      items: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['name', 'quantity', 'isPurchased'],
          properties: {
            _id: { bsonType: 'objectId' },
            name: { bsonType: 'string', minLength: 1, maxLength: 100 },
            quantity: { bsonType: 'number', minimum: 0 },
            unit: { bsonType: 'string', maxLength: 20 },
            estimatedPrice: { bsonType: 'number', minimum: 0 },
            note: { bsonType: 'string', maxLength: 200 },
            isPurchased: { bsonType: 'bool' },
            purchasedBy: { bsonType: 'objectId' },
            purchasedAt: { bsonType: 'date' },
            category: { bsonType: 'string', maxLength: 50 }
          }
        }
      },
      createdBy: { bsonType: 'objectId' },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' },
      completedAt: { bsonType: 'date' },
      totalEstimatedPrice: { bsonType: 'number', minimum: 0 },
      totalActualPrice: { bsonType: 'number', minimum: 0 },
      dueDate: { bsonType: 'date' },
      tags: {
        bsonType: 'array',
        items: { bsonType: 'string', maxLength: 30 }
      }
    }
  },
  indexes: [
    { key: { groupId: 1 } },
    { key: { status: 1 } },
    { key: { 'items.purchasedBy': 1 } },
    { key: { createdBy: 1 } },
    { key: { dueDate: 1 } }
  ]
}
