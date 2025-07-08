import { ObjectId } from 'mongodb'
import databaseService from '~/services/database.services'
import { TransactionType } from '~/models/schemas/transaction.schema'

class UserAnalyticsService {
  // Gọi hàm này sau mỗi lần insert transaction mới!
  async processTransactionAnalytics(transaction: any) {
    const { fromUserId, toUserId, groupId, amount, createdAt, type, metadata } = transaction
    // Update for FROM user (chi tiêu, trả nợ)
    if (type === TransactionType.Payment || type === TransactionType.Adjustment) {
      await this.updateUserAnalytics({
        userId: fromUserId,
        groupId,
        amount,
        date: createdAt,
        type: 'spend',
        category: metadata?.category || transaction.category || 'Khác'
      })
    } else if (type === TransactionType.Refund) {
      // Refund có thể coi là thu nhập bất thường (tùy business)
      await this.updateUserAnalytics({
        userId: fromUserId,
        groupId,
        amount,
        date: createdAt,
        type: 'income',
        category: metadata?.category || transaction.category || 'Khác'
      })
    }

    // Update for TO user (nhận tiền, thu nhập)
    if (type === TransactionType.Payment || type === TransactionType.Refund) {
      await this.updateUserAnalytics({
        userId: toUserId,
        groupId,
        amount,
        date: createdAt,
        type: 'income',
        category: metadata?.category || transaction.category || 'Khác'
      })
    }
  }

  // Cập nhật analytics cho user theo tháng/năm (upsert)
  async updateUserAnalytics({
    userId,
    groupId,
    amount,
    date,
    type,
    category
  }: {
    userId: ObjectId
    groupId: ObjectId
    amount: number
    date: Date
    type: 'spend' | 'income'
    category?: string
  }) {
    if (!userId || !groupId || !amount || !date) return
    const d = new Date(date)
    const year = d.getFullYear()
    const month = d.getMonth() + 1

    const filter: Record<string, unknown> = {
      userId: new ObjectId(userId),
      groupId: new ObjectId(groupId),
      year,
      month
    }
    // Khởi tạo các toán tử update
    const update: Record<string, unknown> = {
      $inc: { transactionCount: 1 },
      $set: { updatedAt: new Date() }
    }
    if (type === 'spend') {
      ;(update.$inc as Record<string, number>).totalSpent = amount
      if (category) {
        ;(update.$inc as Record<string, number>)[`categoriesSpent.${category}`] =
          ((update.$inc as Record<string, number>)[`categoriesSpent.${category}`] || 0) + amount
      }
    }
    if (type === 'income') {
      ;(update.$inc as Record<string, number>).totalPaid = amount
      // Có thể mở rộng analytics khác ở đây
    }
    if (category) {
      update.$addToSet = { mostFrequentCategories: category }
    }

    await databaseService.userAnalytics.updateOne(filter, update, { upsert: true })
  }

  // Lấy tổng quan toàn thời gian, hoặc theo group
  async getUserAnalyticsOverview(userId: string, groupId?: string) {
    const filter: Record<string, unknown> = { userId: new ObjectId(userId) }
    if (groupId) filter.groupId = new ObjectId(groupId)

    const all = await databaseService.userAnalytics.find(filter).toArray()
    let totalSpent = 0,
      totalPaid = 0,
      totalDebt = 0,
      transactionCount = 0
    all.forEach((a) => {
      totalSpent += a.totalSpent || 0
      totalPaid += a.totalPaid || 0
      totalDebt += a.totalDebt || 0
      transactionCount += a.transactionCount || 0
    })
    const balance = totalPaid - totalSpent
    return { totalSpent, totalPaid, totalDebt, transactionCount, balance }
  }

  // Thống kê từng tháng trong 1 năm (cho biểu đồ line, bar)
  async getUserAnalyticsMonthly(userId: string, groupId?: string, year?: string) {
    const filter: Record<string, unknown> = { userId: new ObjectId(userId) }
    if (groupId) filter.groupId = new ObjectId(groupId)
    if (year) filter.year = parseInt(year)
    const arr = await databaseService.userAnalytics.find(filter).sort({ month: 1 }).toArray()
    return arr.map((a) => ({
      month: a.month,
      totalSpent: a.totalSpent,
      totalPaid: a.totalPaid,
      balance: (a.totalPaid || 0) - (a.totalSpent || 0),
      categoriesSpent: a.categoriesSpent,
      transactionCount: a.transactionCount
    }))
  }

  // Thống kê tổng hợp theo năm (biểu đồ cột, compare multi year)
  async getUserAnalyticsYearly(userId: string, groupId?: string) {
    const filter: Record<string, unknown> = { userId: new ObjectId(userId) }
    if (groupId) filter.groupId = new ObjectId(groupId)
    const arr = await databaseService.userAnalytics
      .aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$year',
            totalSpent: { $sum: '$totalSpent' },
            totalPaid: { $sum: '$totalPaid' },
            totalDebt: { $sum: '$totalDebt' },
            transactionCount: { $sum: '$transactionCount' }
          }
        },
        { $sort: { _id: 1 } }
      ])
      .toArray()
    return arr.map((a) => ({
      year: a._id,
      totalSpent: a.totalSpent,
      totalPaid: a.totalPaid,
      totalDebt: a.totalDebt,
      transactionCount: a.transactionCount,
      balance: (a.totalPaid || 0) - (a.totalSpent || 0)
    }))
  }

  // So sánh tháng hiện tại với tháng trước
  async compareUserAnalytics(userId: string, groupId: string | undefined, month: number, year: number) {
    const filterNow: Record<string, unknown> = { userId: new ObjectId(userId), year: year, month: month }
    if (groupId) filterNow.groupId = new ObjectId(groupId)
    const now = await databaseService.userAnalytics.findOne(filterNow)
    let prevYear = year,
      prevMonth = month - 1
    if (prevMonth <= 0) {
      prevMonth = 12
      prevYear -= 1
    }
    const filterPrev: Record<string, unknown> = { userId: new ObjectId(userId), year: prevYear, month: prevMonth }
    if (groupId) filterPrev.groupId = new ObjectId(groupId)
    const prev = await databaseService.userAnalytics.findOne(filterPrev)
    const spentChange = now && prev ? ((now.totalSpent - prev.totalSpent) / (prev.totalSpent || 1)) * 100 : null
    const paidChange = now && prev ? ((now.totalPaid - prev.totalPaid) / (prev.totalPaid || 1)) * 100 : null
    return {
      current: now,
      previous: prev,
      spentChange,
      paidChange
    }
  }
}

export default new UserAnalyticsService()
