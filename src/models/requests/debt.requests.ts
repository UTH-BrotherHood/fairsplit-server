import { DebtStatus } from '../schemas/debt.schema'

export interface GetDebtsReqQuery {
  page?: string
  limit?: string
  status?: DebtStatus
  groupId?: string
  userId?: string
}

export interface SettleDebtReqBody {
  amount: number
  method: 'cash' | 'bank_transfer' | 'other'
  date: string
  notes?: string
}

export interface DebtBodyRequest {
  groupId: string
  from: {
    userId: string
    name: string
  }
  to: {
    userId: string
    name: string
  }
  billId: string
  amount: number
  dueDate?: string
  note?: string
}
