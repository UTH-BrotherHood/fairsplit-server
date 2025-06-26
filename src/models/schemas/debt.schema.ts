import { ObjectId } from 'mongodb'

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
  groupId: ObjectId // nhóm liên quan đến khoản nợ (nếu có)
  from: DebtParticipant // Người nợ tiền (debtor)
  to: DebtParticipant // Người cho vay/người được nhận tiền (creditor)
  billId: ObjectId // (nếu phát sinh từ bill chia tiền)
  amount: number
  remainingAmount: number // Số tiền còn lại chưa thanh toán (giảm dần khi trả dần)
  status: DebtStatus
  settlements?: Settlement[] // Danh sách các lần thanh toán (trả dần, trả góp, v.v.)
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
  settledAt?: Date
  lastReminderSentAt?: Date // Ngày gửi nhắc nhở gần nhất
  reminderCount: number // Số lần đã gửi nhắc nhở
  note?: string // Ghi chú thêm về khoản nợ
}
