import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/env'

export interface IUserAnalytics {
  _id?: ObjectId
  userId: ObjectId
  groupId: ObjectId
  year: number
  month: number
  totalSpent: number
  totalPaid: number
  totalDebt: number
  categoriesSpent: {
    [category: string]: number
  }
  transactionCount: number
  mostFrequentCategories: string[]
  updatedAt: Date
}

export interface IGroupAnalytics {
  _id?: ObjectId
  groupId: ObjectId
  year: number
  month: number
  totalSpent: number
  memberContributions: {
    userId: ObjectId
    amount: number
    percentage: number
  }[]
  categoriesSpent: {
    [category: string]: number
  }
  topSpenders: {
    userId: ObjectId
    amount: number
  }[]
  averagePerMember: number
  transactionCount: number
  listCount: number
  completedListCount: number
  updatedAt: Date
}

export const UserAnalyticsModel = {
  collectionName: envConfig.dbUserAnalyticsCollection,
  jsonSchema: {
    bsonType: 'object',
    required: [
      'userId',
      'groupId',
      'year',
      'month',
      'totalSpent',
      'totalPaid',
      'totalDebt',
      'categoriesSpent',
      'transactionCount',
      'mostFrequentCategories',
      'updatedAt'
    ],
    properties: {
      _id: { bsonType: 'objectId' },
      userId: { bsonType: 'objectId' },
      groupId: { bsonType: 'objectId' },
      year: { bsonType: 'int', minimum: 2000 },
      month: { bsonType: 'int', minimum: 1, maximum: 12 },
      totalSpent: { bsonType: 'number', minimum: 0 },
      totalPaid: { bsonType: 'number', minimum: 0 },
      totalDebt: { bsonType: 'number', minimum: 0 },
      categoriesSpent: { bsonType: 'object' },
      transactionCount: { bsonType: 'int', minimum: 0 },
      mostFrequentCategories: {
        bsonType: 'array',
        items: { bsonType: 'string' }
      },
      updatedAt: { bsonType: 'date' }
    }
  },
  indexes: [{ key: { userId: 1, groupId: 1, year: 1, month: 1 }, unique: true }, { key: { updatedAt: 1 } }]
}

export const GroupAnalyticsModel = {
  collectionName: envConfig.dbUserAnalyticsCollection,
  jsonSchema: {
    bsonType: 'object',
    required: [
      'groupId',
      'year',
      'month',
      'totalSpent',
      'memberContributions',
      'categoriesSpent',
      'topSpenders',
      'averagePerMember',
      'transactionCount',
      'listCount',
      'completedListCount',
      'updatedAt'
    ],
    properties: {
      _id: { bsonType: 'objectId' },
      groupId: { bsonType: 'objectId' },
      year: { bsonType: 'int', minimum: 2000 },
      month: { bsonType: 'int', minimum: 1, maximum: 12 },
      totalSpent: { bsonType: 'number', minimum: 0 },
      memberContributions: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['userId', 'amount', 'percentage'],
          properties: {
            userId: { bsonType: 'objectId' },
            amount: { bsonType: 'number', minimum: 0 },
            percentage: { bsonType: 'number', minimum: 0, maximum: 100 }
          }
        }
      },
      categoriesSpent: { bsonType: 'object' },
      topSpenders: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['userId', 'amount'],
          properties: {
            userId: { bsonType: 'objectId' },
            amount: { bsonType: 'number', minimum: 0 }
          }
        }
      },
      averagePerMember: { bsonType: 'number', minimum: 0 },
      transactionCount: { bsonType: 'int', minimum: 0 },
      listCount: { bsonType: 'int', minimum: 0 },
      completedListCount: { bsonType: 'int', minimum: 0 },
      updatedAt: { bsonType: 'date' }
    }
  },
  indexes: [{ key: { groupId: 1, year: 1, month: 1 }, unique: true }, { key: { updatedAt: 1 } }]
}
