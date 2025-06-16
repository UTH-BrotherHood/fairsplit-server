import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/utils/error.utils'
import { BILL_MESSAGES } from '~/constants/messages'
import { httpStatusCode } from '~/core/httpStatusCode'
import { GroupRole } from '~/models/schemas/group.schema'
import { BillStatus } from '~/models/schemas/bill.schema'
import {
  CreateBillReqBody,
  UpdateBillReqBody,
  GetGroupBillsReqQuery,
  AddPaymentReqBody
} from '~/models/requests/bill.requests'
import databaseService from './database.services'

class BillsService {
  private async checkGroupMembership(userId: string, groupId: string) {
    const group = await databaseService.groups.findOne({
      _id: new ObjectId(groupId),
      'members.userId': new ObjectId(userId),
      isArchived: false
    })

    if (!group) {
      throw new ErrorWithStatus({
        message: BILL_MESSAGES.USER_NOT_IN_GROUP,
        status: httpStatusCode.FORBIDDEN
      })
    }

    return group
  }

  private async checkBillPermission(userId: string, billId: string) {
    const bill = await databaseService.bills.findOne({
      _id: new ObjectId(billId)
    })

    if (!bill) {
      throw new ErrorWithStatus({
        message: BILL_MESSAGES.BILL_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    const group = await databaseService.groups.findOne({
      _id: bill.groupId,
      isArchived: false
    })

    if (!group) {
      throw new ErrorWithStatus({
        message: BILL_MESSAGES.GROUP_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    const member = group.members.find((m) => m.userId.toString() === userId)
    if (!member) {
      throw new ErrorWithStatus({
        message: BILL_MESSAGES.USER_NOT_IN_GROUP,
        status: httpStatusCode.FORBIDDEN
      })
    }

    return { bill, group, member }
  }

  async createBill(userId: string, payload: CreateBillReqBody) {
    const group = await this.checkGroupMembership(userId, payload.groupId)

    // Validate participants
    const validParticipants = payload.participants.every((participant) =>
      group.members.some((member) => member.userId.toString() === participant.userId)
    )

    if (!validParticipants) {
      throw new ErrorWithStatus({
        message: BILL_MESSAGES.INVALID_PARTICIPANTS,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    // Calculate total shares
    const totalShares = payload.participants.reduce((sum, participant) => sum + participant.share, 0)
    if (payload.splitMethod === 'percentage' && Math.abs(totalShares - 100) > 0.01) {
      throw new ErrorWithStatus({
        message: BILL_MESSAGES.INVALID_PERCENTAGE_SPLIT,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    const bill = {
      groupId: new ObjectId(payload.groupId),
      title: payload.title,
      description: payload.description,
      amount: payload.amount,
      currency: payload.currency,
      date: new Date(payload.date),
      category: payload.category,
      splitMethod: payload.splitMethod,
      paidBy: new ObjectId(payload.paidBy),
      participants: payload.participants.map((participant) => ({
        userId: new ObjectId(participant.userId),
        share: participant.share
      })),
      status: BillStatus.Pending,
      payments: [],
      createdBy: new ObjectId(userId),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await databaseService.bills.insertOne(bill)
    return {
      ...bill,
      _id: result.insertedId
    }
  }

  async getGroupBills(userId: string, groupId: string, query: GetGroupBillsReqQuery) {
    await this.checkGroupMembership(userId, groupId)

    const filter: any = {
      groupId: new ObjectId(groupId)
    }

    if (query.startDate) {
      filter.date = { $gte: new Date(query.startDate) }
    }

    if (query.endDate) {
      filter.date = { ...filter.date, $lte: new Date(query.endDate) }
    }

    if (query.category) {
      filter.category = query.category
    }

    if (query.status) {
      filter.status = query.status
    }

    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const skip = (page - 1) * limit

    const [bills, total] = await Promise.all([
      databaseService.bills.find(filter).sort({ date: -1 }).skip(skip).limit(limit).toArray(),
      databaseService.bills.countDocuments(filter)
    ])

    return {
      bills,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    }
  }

  async getBillById(userId: string, billId: string) {
    const { bill } = await this.checkBillPermission(userId, billId)
    return bill
  }

  async updateBill(userId: string, billId: string, payload: UpdateBillReqBody) {
    const { bill, group, member } = await this.checkBillPermission(userId, billId)

    // Only bill creator, group owner, or admin can update the bill
    if (bill.createdBy.toString() !== userId && ![GroupRole.Owner, GroupRole.Admin].includes(member.role)) {
      throw new ErrorWithStatus({
        message: BILL_MESSAGES.NOT_BILL_CREATOR,
        status: httpStatusCode.FORBIDDEN
      })
    }

    if (payload.participants) {
      // Validate participants
      const validParticipants = payload.participants.every((participant) =>
        group.members.some((member) => member.userId.toString() === participant.userId)
      )

      if (!validParticipants) {
        throw new ErrorWithStatus({
          message: BILL_MESSAGES.INVALID_PARTICIPANTS,
          status: httpStatusCode.BAD_REQUEST
        })
      }

      // Calculate total shares
      const totalShares = payload.participants.reduce((sum, participant) => sum + participant.share, 0)
      if (payload.splitMethod === 'percentage' && Math.abs(totalShares - 100) > 0.01) {
        throw new ErrorWithStatus({
          message: BILL_MESSAGES.INVALID_PERCENTAGE_SPLIT,
          status: httpStatusCode.BAD_REQUEST
        })
      }
    }

    const updateData: any = {
      ...(payload.title && { title: payload.title }),
      ...(payload.description && { description: payload.description }),
      ...(payload.amount && { amount: payload.amount }),
      ...(payload.date && { date: new Date(payload.date) }),
      ...(payload.category && { category: payload.category }),
      ...(payload.splitMethod && { splitMethod: payload.splitMethod }),
      ...(payload.participants && {
        participants: payload.participants.map((participant) => ({
          userId: new ObjectId(participant.userId),
          share: participant.share
        }))
      }),
      updatedAt: new Date()
    }

    const result = await databaseService.bills.findOneAndUpdate(
      { _id: new ObjectId(billId) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  }

  async deleteBill(userId: string, billId: string) {
    const { bill, member } = await this.checkBillPermission(userId, billId)

    // Only bill creator, group owner, or admin can delete the bill
    if (bill.createdBy.toString() !== userId && ![GroupRole.Owner, GroupRole.Admin].includes(member.role)) {
      throw new ErrorWithStatus({
        message: BILL_MESSAGES.NOT_BILL_CREATOR,
        status: httpStatusCode.FORBIDDEN
      })
    }

    if (bill.payments.length > 0) {
      throw new ErrorWithStatus({
        message: BILL_MESSAGES.BILL_HAS_PAYMENTS,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    await databaseService.bills.deleteOne({ _id: new ObjectId(billId) })
    return true
  }

  async addPayment(userId: string, billId: string, payload: AddPaymentReqBody) {
    const { bill, group } = await this.checkBillPermission(userId, billId)

    // Validate paidBy and paidTo are group members
    const validUsers = [payload.paidBy, payload.paidTo].every((userId) =>
      group.members.some((member) => member.userId.toString() === userId)
    )

    if (!validUsers) {
      throw new ErrorWithStatus({
        message: BILL_MESSAGES.INVALID_USERS,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    const payment = {
      _id: new ObjectId(),
      amount: payload.amount,
      paidBy: new ObjectId(payload.paidBy),
      paidTo: new ObjectId(payload.paidTo),
      date: new Date(payload.date),
      method: payload.method,
      notes: payload.notes,
      createdBy: new ObjectId(userId),
      createdAt: new Date()
    }

    const result = await databaseService.bills.findOneAndUpdate(
      { _id: new ObjectId(billId) },
      {
        $push: { payments: payment },
        $set: {
          status: this.calculateBillStatus(bill, [...bill.payments, payment]),
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    )

    return result
  }

  private calculateBillStatus(bill: any, payments: any[]) {
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)

    if (totalPaid === 0) return BillStatus.Pending
    if (totalPaid < bill.amount) return BillStatus.PartiallyPaid
    return BillStatus.Completed
  }

  async getBillPayments(userId: string, billId: string) {
    const { bill } = await this.checkBillPermission(userId, billId)
    return bill.payments
  }
}

const billsService = new BillsService()
export default billsService
