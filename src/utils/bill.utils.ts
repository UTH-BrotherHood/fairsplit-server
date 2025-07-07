import { ObjectId } from 'mongodb'
import { IBillParticipant, IBillPayment } from '~/models/schemas/bill.schema'
import { ErrorWithStatus } from './error.utils'
import { BILL_MESSAGES } from '~/constants/messages'
import httpStatusCode from '~/core/statusCodes'

export function calculateParticipantSharesAndAmounts({
  participants,
  splitMethod,
  amount,
  payments = []
}: {
  participants: Array<{ userId: ObjectId; share?: number }>
  splitMethod: 'equal' | 'percentage'
  amount: number
  payments?: IBillPayment[]
}): IBillParticipant[] {
  const userPaidMap = new Map<string, number>()
  for (const payment of payments) {
    const paid = userPaidMap.get(payment.paidBy.toString()) || 0
    userPaidMap.set(payment.paidBy.toString(), paid + payment.amount)
  }

  if (splitMethod === 'equal') {
    const equalAmount = amount / participants.length
    return participants.map((p) => {
      const paid = userPaidMap.get(p.userId.toString()) || 0
      const remaining = Math.max(0, equalAmount - paid)
      return {
        userId: p.userId,
        share: parseFloat((100 / participants.length).toFixed(2)),
        amountOwed: Math.round(remaining)
      }
    })
  }

  // percentage: requires `share`
  const totalShare = participants.reduce((sum, p) => sum + (p.share ?? 0), 0)
  if (Math.abs(totalShare - 100) > 0.01) {
    throw new ErrorWithStatus({
      message: BILL_MESSAGES.INVALID_PERCENTAGE_SPLIT,
      status: httpStatusCode.BAD_REQUEST
    })
  }

  return participants.map((p) => {
    const percent = p.share ?? 0
    const expected = (percent / 100) * amount
    const paid = userPaidMap.get(p.userId.toString()) || 0
    const remaining = Math.max(0, expected - paid)
    return {
      userId: p.userId,
      share: parseFloat(percent.toFixed(2)),
      amountOwed: Math.round(remaining)
    }
  })
}
