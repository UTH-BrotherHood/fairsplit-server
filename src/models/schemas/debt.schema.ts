import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/env'

export enum DebtStatus {
  Active = 'active',
  Settled = 'settled',
  Disputed = 'disputed'
}

export interface IDebt {
  _id?: ObjectId
  groupId: ObjectId
  fromUserId: ObjectId
  toUserId: ObjectId
  billId: ObjectId
  amount: number
  remainingAmount: number
  status: DebtStatus
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
  settledAt?: Date
  lastReminderSentAt?: Date
  reminderCount: number
  note?: string
}

export const DebtModel = {
  collectionName: envConfig.dbDebtCollection,
  jsonSchema: {
    bsonType: 'object',
    required: [
      'groupId',
      'fromUserId',
      'toUserId',
      'billId',
      'amount',
      'remainingAmount',
      'status',
      'createdAt',
      'updatedAt',
      'reminderCount'
    ],
    properties: {
      _id: { bsonType: 'objectId' },
      groupId: { bsonType: 'objectId' },
      fromUserId: { bsonType: 'objectId' },
      toUserId: { bsonType: 'objectId' },
      billId: { bsonType: 'objectId' },
      amount: {
        bsonType: 'number',
        minimum: 0
      },
      remainingAmount: {
        bsonType: 'number',
        minimum: 0
      },
      status: {
        enum: Object.values(DebtStatus)
      },
      dueDate: { bsonType: 'date' },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' },
      settledAt: { bsonType: 'date' },
      lastReminderSentAt: { bsonType: 'date' },
      reminderCount: {
        bsonType: 'int',
        minimum: 0
      },
      note: {
        bsonType: 'string',
        maxLength: 500
      }
    }
  },
  indexes: [
    { key: { groupId: 1 } },
    { key: { fromUserId: 1 } },
    { key: { toUserId: 1 } },
    { key: { billId: 1 } },
    { key: { status: 1 } },
    { key: { dueDate: 1 } },
    // Compound index for querying debts between two users in a group
    { key: { groupId: 1, fromUserId: 1, toUserId: 1 } }
  ]
}
