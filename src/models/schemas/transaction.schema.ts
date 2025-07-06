import { ObjectId } from 'mongodb'

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
  metadata?: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
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
  metadata?: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

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
