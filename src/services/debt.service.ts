import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/utils/error.utils'
import { DEBT_MESSAGES } from '~/constants/messages'
import { httpStatusCode } from '~/core/httpStatusCode'
import { DebtStatus, Settlement } from '~/models/schemas/debt.schema'
import { IDebt } from '~/models/schemas/debt.schema'
import { DebtBodyRequest, GetDebtsReqQuery, SettleDebtReqBody } from '~/models/requests/debt.requests'
import databaseService from './database.services'
import { PaymentMethod, TransactionStatus, TransactionType } from '~/models/schemas/transaction.schema'
import userAnalyticsService from './userAnalytics.service'

class DebtsService {
  private async checkGroupMembership(userId: string, groupId: string) {
    const group = await databaseService.groups.findOne({
      _id: new ObjectId(groupId),
      'members.userId': new ObjectId(userId),
      isArchived: false
    })

    if (!group) {
      throw new ErrorWithStatus({
        message: DEBT_MESSAGES.USER_NOT_IN_GROUP,
        status: httpStatusCode.FORBIDDEN
      })
    }

    return group
  }

  private async checkDebtPermission(userId: string, debtId: string) {
    const debt = await databaseService.debts.findOne({
      _id: new ObjectId(debtId)
    })

    if (!debt) {
      throw new ErrorWithStatus({
        message: DEBT_MESSAGES.DEBT_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    const group = await databaseService.groups.findOne({
      _id: debt.groupId,
      isArchived: false
    })

    if (!group) {
      throw new ErrorWithStatus({
        message: DEBT_MESSAGES.GROUP_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    const member = group.members.find((m) => m.userId.toString() === userId)
    if (!member) {
      throw new ErrorWithStatus({
        message: DEBT_MESSAGES.USER_NOT_IN_GROUP,
        status: httpStatusCode.FORBIDDEN
      })
    }

    return { debt, group, member }
  }

  async getGroupDebts(userId: string, groupId: string, query: GetDebtsReqQuery) {
    await this.checkGroupMembership(userId, groupId)

    const filter: any = {
      groupId: new ObjectId(groupId)
    }

    if (query.status) {
      filter.status = query.status
    }

    if (query.userId) {
      filter.$or = [{ 'from.userId': new ObjectId(query.userId) }, { 'to.userId': new ObjectId(query.userId) }]
    }

    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const skip = (page - 1) * limit

    const [debts, total] = await Promise.all([
      databaseService.debts.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      databaseService.debts.countDocuments(filter)
    ])

    return {
      debts,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    }
  }

  async getMyDebts(userId: string, query: GetDebtsReqQuery) {
    const filter: any = {
      $or: [{ 'from.userId': new ObjectId(userId) }, { 'to.userId': new ObjectId(userId) }]
    }

    if (query.status) {
      filter.status = query.status
    }

    if (query.groupId) {
      filter.groupId = new ObjectId(query.groupId)
    }

    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const skip = (page - 1) * limit

    const [debts, total] = await Promise.all([
      databaseService.debts.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      databaseService.debts.countDocuments(filter)
    ])

    return {
      debts,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    }
  }

  async settleDebt(userId: string, debtId: string, payload: SettleDebtReqBody) {
    const { debt } = await this.checkDebtPermission(userId, debtId)

    if (debt.status === DebtStatus.Settled) {
      throw new ErrorWithStatus({
        message: DEBT_MESSAGES.DEBT_ALREADY_SETTLED,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    if (debt.from.userId.toString() !== userId && debt.to.userId.toString() !== userId) {
      throw new ErrorWithStatus({
        message: DEBT_MESSAGES.NOT_DEBT_PARTICIPANT,
        status: httpStatusCode.FORBIDDEN
      })
    }

    const settlement: Settlement = {
      _id: new ObjectId(),
      amount: payload.amount,
      method: payload.method,
      date: new Date(payload.date),
      notes: payload.notes,
      settledBy: new ObjectId(userId),
      createdAt: new Date()
    }

    const remainingAmount =
      debt.amount - (debt.settlements?.reduce((sum: number, s: Settlement) => sum + s.amount, 0) || 0)
    const newStatus = payload.amount >= remainingAmount ? DebtStatus.Settled : DebtStatus.PartialSettled

    const result = await databaseService.debts.findOneAndUpdate(
      { _id: new ObjectId(debtId) },
      {
        $push: { settlements: settlement },
        $set: {
          status: newStatus,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    )

    const transaction = {
      groupId: debt.groupId,
      billId: debt.billId,
      fromUserId: debt.from.userId,
      toUserId: debt.to.userId,
      amount: settlement.amount,
      type: TransactionType.Payment,
      status: TransactionStatus.Completed,
      paymentMethod: settlement.method as PaymentMethod,
      paymentProof: undefined,
      note: settlement.notes,
      createdAt: settlement.createdAt,
      updatedAt: settlement.createdAt,
      completedAt: settlement.createdAt,
      userId: settlement.settledBy,
      description: `Trả nợ cho bill: ${debt.billId}`,
      metadata: {}
    }
    await databaseService.transactions.insertOne(transaction)

    await userAnalyticsService.processTransactionAnalytics(transaction)

    return result
  }

  async getDebtHistory(userId: string, debtId: string) {
    const { debt } = await this.checkDebtPermission(userId, debtId)

    if (debt.from.userId.toString() !== userId && debt.to.userId.toString() !== userId) {
      throw new ErrorWithStatus({
        message: DEBT_MESSAGES.NOT_DEBT_PARTICIPANT,
        status: httpStatusCode.FORBIDDEN
      })
    }

    return debt.settlements || []
  }

  async createDebt(userId: string, payload: DebtBodyRequest) {
    // Kiểm tra user thuộc group
    await this.checkGroupMembership(userId, payload.groupId)

    // Kiểm tra billId, from.userId, to.userId song song
    const [bill, fromUser, toUser] = await Promise.all([
      databaseService.bills.findOne({ _id: new ObjectId(payload.billId) }),
      databaseService.users.findOne({ _id: new ObjectId(payload.from.userId) }),
      databaseService.users.findOne({ _id: new ObjectId(payload.to.userId) })
    ])

    if (!bill) {
      throw new ErrorWithStatus({
        message: 'Bill not found',
        status: httpStatusCode.NOT_FOUND
      })
    }
    if (!fromUser) {
      throw new ErrorWithStatus({
        message: 'From user not found',
        status: httpStatusCode.NOT_FOUND
      })
    }
    if (!toUser) {
      throw new ErrorWithStatus({
        message: 'To user not found',
        status: httpStatusCode.NOT_FOUND
      })
    }

    const debt: IDebt = {
      groupId: new ObjectId(payload.groupId),
      from: {
        userId: new ObjectId(payload.from.userId),
        name: payload.from.name
      },
      to: {
        userId: new ObjectId(payload.to.userId),
        name: payload.to.name
      },
      billId: new ObjectId(payload.billId),
      amount: payload.amount,
      remainingAmount: payload.amount,
      status: DebtStatus.Active,
      settlements: [],
      dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      reminderCount: 0,
      note: payload.note
    }

    const result = await databaseService.debts.insertOne(debt)
    return {
      ...debt,
      _id: result.insertedId
    }
  }
}

const debtsService = new DebtsService()
export default debtsService
