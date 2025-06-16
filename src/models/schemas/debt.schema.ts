import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/env'

export enum DebtStatus {
  Active = 'active',
  Settled = 'settled',
  PartialSettled = 'partially_settled',
  Disputed = 'disputed'
}

export interface Settlement {
  _id: ObjectId
  amount: number
  method: string
  date: Date
  notes?: string
  settledBy: ObjectId
  createdAt: Date
}

export interface DebtParticipant {
  userId: ObjectId
  name: string
}

export interface IDebt {
  _id?: ObjectId
  groupId: ObjectId
  from: DebtParticipant
  to: DebtParticipant
  billId: ObjectId
  amount: number
  remainingAmount: number
  status: DebtStatus
  settlements?: Settlement[]
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
      'from',
      'to',
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
      from: {
        bsonType: 'object',
        required: ['userId', 'name'],
        properties: {
          userId: { bsonType: 'objectId' },
          name: { bsonType: 'string' }
        }
      },
      to: {
        bsonType: 'object',
        required: ['userId', 'name'],
        properties: {
          userId: { bsonType: 'objectId' },
          name: { bsonType: 'string' }
        }
      },
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
      settlements: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['_id', 'amount', 'method', 'date', 'settledBy'],
          properties: {
            _id: { bsonType: 'objectId' },
            amount: { bsonType: 'number' },
            method: { bsonType: 'string' },
            date: { bsonType: 'date' },
            settledBy: { bsonType: 'objectId' }
          }
        }
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
    { key: { 'from.userId': 1 } },
    { key: { 'to.userId': 1 } },
    { key: { billId: 1 } },
    { key: { status: 1 } },
    { key: { dueDate: 1 } },
    // Compound index for querying debts between two users in a group
    { key: { groupId: 1, 'from.userId': 1, 'to.userId': 1 } }
  ]
}
