import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/env'

export enum TransactionType {
  Payment = 'payment',
  Refund = 'refund',
  Adjustment = 'adjustment'
}

export enum TransactionStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled'
}

export enum PaymentMethod {
  Cash = 'cash',
  BankTransfer = 'bank_transfer',
  Momo = 'momo',
  ZaloPay = 'zalopay',
  VNPay = 'vnpay'
}

export interface ITransaction {
  _id?: ObjectId
  groupId: ObjectId
  billId?: ObjectId
  fromUserId: ObjectId
  toUserId: ObjectId
  amount: number
  type: TransactionType
  status: TransactionStatus
  paymentMethod?: PaymentMethod
  paymentProof?: string
  note?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  externalPaymentId?: string
  userId: ObjectId
  description?: string
  metadata?: Record<string, any>
}

export class Transaction implements ITransaction {
  _id?: ObjectId
  amount: number
  type: TransactionType
  status: TransactionStatus
  userId: ObjectId
  groupId: ObjectId
  billId?: ObjectId
  fromUserId: ObjectId
  toUserId: ObjectId
  paymentMethod?: PaymentMethod
  paymentProof?: string
  note?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  externalPaymentId?: string
  description?: string
  metadata?: Record<string, any>

  constructor({
    amount,
    type,
    status,
    userId,
    groupId,
    billId,
    fromUserId,
    toUserId,
    paymentMethod,
    paymentProof,
    note,
    createdAt,
    updatedAt,
    completedAt,
    externalPaymentId,
    description,
    metadata
  }: ITransaction) {
    this.amount = amount
    this.type = type
    this.status = status
    this.userId = userId
    this.groupId = groupId
    this.billId = billId
    this.fromUserId = fromUserId
    this.toUserId = toUserId
    this.paymentMethod = paymentMethod
    this.paymentProof = paymentProof
    this.note = note
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.completedAt = completedAt
    this.externalPaymentId = externalPaymentId
    this.description = description
    this.metadata = metadata
  }
}

export const TransactionModel = {
  collectionName: envConfig.dbTransactionCollection,
  jsonSchema: {
    bsonType: 'object',
    required: ['amount', 'type', 'status', 'userId', 'groupId'],
    properties: {
      _id: { bsonType: 'objectId' },
      amount: { bsonType: 'number' },
      type: { bsonType: 'string', enum: Object.values(TransactionType) },
      status: { bsonType: 'string', enum: Object.values(TransactionStatus) },
      userId: { bsonType: 'objectId' },
      groupId: { bsonType: 'objectId' },
      billId: { bsonType: 'objectId' },
      fromUserId: { bsonType: 'objectId' },
      toUserId: { bsonType: 'objectId' },
      paymentMethod: { bsonType: 'string', enum: Object.values(PaymentMethod) },
      paymentProof: { bsonType: 'string', pattern: '^https?://' },
      note: { bsonType: 'string', maxLength: 500 },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' },
      completedAt: { bsonType: 'date' },
      externalPaymentId: { bsonType: 'string', maxLength: 100 },
      description: { bsonType: 'string' },
      metadata: { bsonType: 'object' }
    }
  },
  indexes: [
    { key: { userId: 1 } },
    { key: { groupId: 1 } },
    { key: { status: 1 } },
    { key: { type: 1 } },
    { key: { createdAt: -1 } },
    { key: { externalPaymentId: 1 }, sparse: true }
  ]
}
