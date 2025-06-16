import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/env'

export enum BillStatus {
  Pending = 'pending',
  PartiallyPaid = 'partially_paid',
  Completed = 'completed',
  Cancelled = 'cancelled'
}

export interface IBillParticipant {
  userId: ObjectId
  share: number
}

export interface IBillPayment {
  _id: ObjectId
  amount: number
  paidBy: ObjectId
  paidTo: ObjectId
  date: Date
  method: 'cash' | 'bank_transfer' | 'other'
  notes?: string
  createdBy: ObjectId
  createdAt: Date
}

export interface IBill {
  _id?: ObjectId
  groupId: ObjectId
  title: string
  description?: string
  amount: number
  currency: string
  date: Date
  category: string
  splitMethod: 'equal' | 'percentage'
  paidBy: ObjectId
  participants: IBillParticipant[]
  status: BillStatus
  payments: IBillPayment[]
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
}

export class Bill implements IBill {
  _id?: ObjectId
  groupId: ObjectId
  title: string
  description?: string
  amount: number
  currency: string
  date: Date
  category: string
  splitMethod: 'equal' | 'percentage'
  paidBy: ObjectId
  participants: IBillParticipant[]
  status: BillStatus
  payments: IBillPayment[]
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date

  constructor({
    groupId,
    title,
    description,
    amount,
    currency,
    date,
    category,
    splitMethod,
    paidBy,
    participants,
    status,
    payments,
    createdBy,
    createdAt,
    updatedAt
  }: IBill) {
    this.groupId = groupId
    this.title = title
    this.description = description
    this.amount = amount
    this.currency = currency
    this.date = date
    this.category = category
    this.splitMethod = splitMethod
    this.paidBy = paidBy
    this.participants = participants
    this.status = status
    this.payments = payments
    this.createdBy = createdBy
    this.createdAt = createdAt || new Date()
    this.updatedAt = updatedAt || new Date()
  }
}

export const BillModel = {
  collectionName: envConfig.dbBillCollection,
  jsonSchema: {
    bsonType: 'object',
    required: [
      'groupId',
      'title',
      'amount',
      'currency',
      'date',
      'category',
      'splitMethod',
      'paidBy',
      'participants',
      'status',
      'payments',
      'createdBy',
      'createdAt',
      'updatedAt'
    ],
    properties: {
      _id: { bsonType: 'objectId' },
      groupId: { bsonType: 'objectId' },
      title: {
        bsonType: 'string',
        minLength: 1,
        maxLength: 100
      },
      description: {
        bsonType: 'string',
        maxLength: 500
      },
      amount: {
        bsonType: 'number',
        minimum: 0
      },
      currency: {
        bsonType: 'string',
        minLength: 3,
        maxLength: 3
      },
      date: { bsonType: 'date' },
      category: {
        bsonType: 'string',
        minLength: 1,
        maxLength: 50
      },
      splitMethod: {
        enum: ['equal', 'percentage']
      },
      paidBy: { bsonType: 'objectId' },
      participants: {
        bsonType: 'array',
        minItems: 1,
        items: {
          bsonType: 'object',
          required: ['userId', 'share'],
          properties: {
            userId: { bsonType: 'objectId' },
            share: {
              bsonType: 'number',
              minimum: 0
            }
          }
        }
      },
      status: {
        enum: Object.values(BillStatus)
      },
      payments: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['_id', 'amount', 'paidBy', 'paidTo', 'date', 'method', 'createdBy', 'createdAt'],
          properties: {
            _id: { bsonType: 'objectId' },
            amount: {
              bsonType: 'number',
              minimum: 0
            },
            paidBy: { bsonType: 'objectId' },
            paidTo: { bsonType: 'objectId' },
            date: { bsonType: 'date' },
            method: {
              enum: ['cash', 'bank_transfer', 'other']
            },
            notes: {
              bsonType: 'string',
              maxLength: 500
            },
            createdBy: { bsonType: 'objectId' },
            createdAt: { bsonType: 'date' }
          }
        }
      },
      createdBy: { bsonType: 'objectId' },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' }
    }
  },
  indexes: [
    { key: { groupId: 1 } },
    { key: { paidBy: 1 } },
    { key: { 'participants.userId': 1 } },
    { key: { status: 1 } },
    { key: { date: -1 } }
  ]
}
