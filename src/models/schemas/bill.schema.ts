import { ObjectId } from 'mongodb'

export enum BillStatus {
  Pending = 'pending',
  PartiallyPaid = 'partially_paid',
  Completed = 'completed',
  Cancelled = 'cancelled'
}

export interface IBillParticipant {
  userId: ObjectId
  share: number
  amountOwed: number
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
    this.splitMethod = splitMethod ? splitMethod : 'equal'
    this.paidBy = paidBy
    this.participants = participants
    this.status = status
    this.payments = payments
    this.createdBy = createdBy
    this.createdAt = createdAt || new Date()
    this.updatedAt = updatedAt || new Date()
  }
}
