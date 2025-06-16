import { BillStatus } from '../schemas/bill.schema'

export interface CreateBillReqBody {
  groupId: string
  title: string
  description?: string
  amount: number
  currency: string
  date: string
  category: string
  splitMethod: 'equal' | 'percentage'
  paidBy: string
  participants: Array<{
    userId: string
    share: number
  }>
}

export interface UpdateBillReqBody {
  title?: string
  description?: string
  amount?: number
  date?: string
  category?: string
  splitMethod?: 'equal' | 'percentage'
  participants?: Array<{
    userId: string
    share: number
  }>
}

export interface GetGroupBillsReqQuery {
  page?: string
  limit?: string
  startDate?: string
  endDate?: string
  category?: string
  status?: BillStatus
}

export interface AddPaymentReqBody {
  amount: number
  paidBy: string
  paidTo: string
  date: string
  method: 'cash' | 'bank_transfer' | 'other'
  notes?: string
}
