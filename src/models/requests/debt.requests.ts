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
