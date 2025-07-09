import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/utils/error.utils'
import { BILL_MESSAGES } from '~/constants/messages'
import { httpStatusCode } from '~/core/httpStatusCode'
import { GroupRole } from '~/models/schemas/group.schema'
import { BillStatus, IBill, IBillPayment } from '~/models/schemas/bill.schema'
import {
  CreateBillReqBody,
  UpdateBillReqBody,
  GetGroupBillsReqQuery,
  AddPaymentReqBody
} from '~/models/requests/bill.requests'
import databaseService from './database.services'
import databaseServices from './database.services'
import { calculateParticipantSharesAndAmounts } from '~/utils/bill.utils'
import { PaymentMethod, TransactionStatus, TransactionType } from '~/models/schemas/transaction.schema'
import userAnalyticsService from './userAnalytics.service'
import { excludeSensitiveFieldsForAnotherUser } from '~/utils/user.utils'
class BillService {
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

  private calculateBillStatus(bill: IBill, payments: IBillPayment[]) {
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)

    if (totalPaid === 0) return BillStatus.Pending
    if (totalPaid < bill.amount) return BillStatus.PartiallyPaid
    return BillStatus.Completed
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

    // Kiểm tra paidBy có trong group không
    const checkPaidBy =
      (await databaseServices.users.findOne({ _id: new ObjectId(payload.paidBy) })) &&
      (await this.checkGroupMembership(payload.paidBy, payload.groupId))

    if (!checkPaidBy) {
      throw new ErrorWithStatus({
        message: BILL_MESSAGES.USER_NOT_IN_GROUP,
        status: httpStatusCode.NOT_FOUND
      })
    }

    const validParticipants = payload.participants.every((participant) => {
      const isValid = group.members.some((member) => member.userId.toString() === participant.userId.toString())
      return isValid
    })

    if (!validParticipants) {
      throw new ErrorWithStatus({
        message: BILL_MESSAGES.INVALID_PARTICIPANTS,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    // Chuẩn hóa payments
    const payments = (payload.payments || []).map((p) => ({
      _id: new ObjectId(),
      amount: p.amount,
      paidBy: new ObjectId(p.paidBy),
      paidTo: new ObjectId(p.paidTo),
      date: new Date(p.date),
      method: p.method,
      notes: p.notes,
      createdBy: new ObjectId(userId),
      createdAt: new Date(p.createdAt || Date.now())
    }))

    const rawParticipants = payload.participants.map((p) => ({
      userId: new ObjectId(p.userId),
      share: p.share // required if percentage
    }))

    const participants = calculateParticipantSharesAndAmounts({
      participants: rawParticipants,
      splitMethod: payload.splitMethod,
      amount: payload.amount,
      payments
    })

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
      participants,
      status: BillStatus.Pending,
      payments,
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

    // Lấy tất cả userId của participants trong các bill
    const allParticipantIds = [...new Set(bills.flatMap((bill) => bill.participants.map((p) => p.userId.toString())))]
    const users = await databaseService.users
      .find({ _id: { $in: allParticipantIds.map((id) => new ObjectId(id)) } })
      .toArray()
    const userMap = new Map(users.map((u) => [u._id.toString(), excludeSensitiveFieldsForAnotherUser(u)]))

    const billsWithUser = bills.map((bill) => ({
      ...bill,
      participants: bill.participants.map((p) => {
        const user = userMap.get(p.userId.toString())
        return {
          ...p,
          username: user ? user.username : null,
          avatarUrl: user ? user.avatarUrl : null
        }
      })
    }))

    return {
      bills: billsWithUser,
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
    // Lấy tất cả userId của participants
    const participantIds = [...new Set(bill.participants.map((p) => p.userId.toString()))]
    const users = await databaseService.users
      .find({ _id: { $in: participantIds.map((id) => new ObjectId(id)) } })
      .toArray()
    const userMap = new Map(users.map((u) => [u._id.toString(), excludeSensitiveFieldsForAnotherUser(u)]))
    return {
      ...bill,
      participants: bill.participants.map((p) => {
        const user = userMap.get(p.userId.toString())
        return {
          ...p,
          username: user ? user.username : null,
          avatarUrl: user ? user.avatarUrl : null
        }
      })
    }
  }

  async updateBill(userId: string, billId: string, payload: UpdateBillReqBody) {
    const { bill, group, member } = await this.checkBillPermission(userId, billId)

    if (bill.createdBy.toString() !== userId && ![GroupRole.Owner, GroupRole.Admin].includes(member.role)) {
      throw new ErrorWithStatus({
        message: BILL_MESSAGES.NOT_BILL_CREATOR,
        status: httpStatusCode.FORBIDDEN
      })
    }

    // Validate participants nếu có
    if (payload.participants) {
      const validParticipants = payload.participants.every((p) =>
        group.members.some((m) => m.userId.toString() === p.userId.toString())
      )

      if (!validParticipants) {
        throw new ErrorWithStatus({
          message: BILL_MESSAGES.INVALID_PARTICIPANTS,
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
      updatedAt: new Date()
    }

    const newSplitMethod = payload.splitMethod || bill.splitMethod
    const newAmount = payload.amount || bill.amount

    const rawParticipants = (
      payload.participants ||
      bill.participants.map((p) => ({
        userId: p.userId.toString(),
        share: p.share
      }))
    ).map((p) => ({
      userId: new ObjectId(p.userId),
      share: p.share
    }))

    const participants = calculateParticipantSharesAndAmounts({
      participants: rawParticipants,
      splitMethod: newSplitMethod,
      amount: newAmount,
      payments: bill.payments
    })

    updateData.participants = participants

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

    const transaction = {
      groupId: bill.groupId,
      billId: new ObjectId(billId),
      fromUserId: payment.paidBy,
      toUserId: payment.paidTo,
      amount: payment.amount,
      type: TransactionType.Payment,
      status: TransactionStatus.Completed,
      paymentMethod: payment.method as PaymentMethod,
      paymentProof: undefined,
      note: payment.notes,
      createdAt: payment.createdAt,
      updatedAt: payment.createdAt,
      completedAt: payment.createdAt,
      userId: new ObjectId(userId),
      description: `Thanh toán cho bill: ${bill.title}`,
      metadata: { category: bill.category }
    }

    await databaseService.transactions.insertOne(transaction)

    await userAnalyticsService.processTransactionAnalytics(transaction)

    return result
  }

  async getBillPayments(userId: string, billId: string) {
    const { bill } = await this.checkBillPermission(userId, billId)
    return bill.payments
  }

  async updatePayment(userId: string, billId: string, paymentId: string, updateData: any) {
    const { bill, member } = await this.checkBillPermission(userId, billId)
    const paymentIndex = bill.payments.findIndex((p) => p._id.toString() === paymentId)
    if (paymentIndex === -1) {
      throw new ErrorWithStatus({
        message: BILL_MESSAGES.PAYMENT_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }
    // Only creator of payment or group owner/admin can update
    if (
      bill.payments[paymentIndex].createdBy.toString() !== userId &&
      ![GroupRole.Owner, GroupRole.Admin].includes(member.role)
    ) {
      throw new ErrorWithStatus({
        message: BILL_MESSAGES.NOT_BILL_CREATOR,
        status: httpStatusCode.FORBIDDEN
      })
    }
    const updateFields: any = {}
    if (updateData.amount !== undefined) updateFields['payments.$.amount'] = updateData.amount
    if (updateData.paidBy !== undefined) updateFields['payments.$.paidBy'] = new ObjectId(updateData.paidBy)
    if (updateData.paidTo !== undefined) updateFields['payments.$.paidTo'] = new ObjectId(updateData.paidTo)
    if (updateData.date !== undefined) updateFields['payments.$.date'] = new Date(updateData.date)
    if (updateData.method !== undefined) updateFields['payments.$.method'] = updateData.method
    if (updateData.notes !== undefined) updateFields['payments.$.notes'] = updateData.notes
    updateFields['updatedAt'] = new Date()
    const result = await databaseService.bills.findOneAndUpdate(
      { _id: new ObjectId(billId), 'payments._id': new ObjectId(paymentId) },
      { $set: updateFields },
      { returnDocument: 'after' }
    )
    const updatedPayment =
      result && result.payments ? result.payments.find((p: IBillPayment) => p._id.toString() === paymentId) : null

    if (!updatedPayment) {
      throw new ErrorWithStatus({
        message: BILL_MESSAGES.PAYMENT_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }
    return updatedPayment
  }

  async deletePayment(userId: string, billId: string, paymentId: string) {
    const { bill, member } = await this.checkBillPermission(userId, billId)
    const payment = bill.payments.find((p) => p._id.toString() === paymentId)
    if (!payment) {
      throw new ErrorWithStatus({
        message: BILL_MESSAGES.PAYMENT_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }
    // Only creator of payment or group owner/admin can delete
    if (payment.createdBy.toString() !== userId && ![GroupRole.Owner, GroupRole.Admin].includes(member.role)) {
      throw new ErrorWithStatus({
        message: BILL_MESSAGES.NOT_BILL_CREATOR,
        status: httpStatusCode.FORBIDDEN
      })
    }
    await databaseService.bills.updateOne(
      { _id: new ObjectId(billId) },
      { $pull: { payments: { _id: new ObjectId(paymentId) } }, $set: { updatedAt: new Date() } }
    )
    return true
  }
}

const billService = new BillService()
export default billService
