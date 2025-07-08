import { ObjectId } from 'mongodb'

export interface IUserAnalytics {
  _id?: ObjectId
  userId: ObjectId
  groupId: ObjectId
  year: number
  month: number
  totalSpent: number
  totalPaid: number
  totalDebt: number
  categoriesSpent: {
    [category: string]: number
  }
  transactionCount: number
  mostFrequentCategories: string[]
  updatedAt: Date
}

export interface IGroupAnalytics {
  _id?: ObjectId
  groupId: ObjectId
  year: number
  month: number
  totalSpent: number
  memberContributions: {
    userId: ObjectId
    amount: number
    percentage: number
  }[]
  categoriesSpent: {
    [category: string]: number
  }
  topSpenders: {
    userId: ObjectId
    amount: number
  }[]
  averagePerMember: number
  transactionCount: number
  listCount: number
  completedListCount: number
  updatedAt: Date
}
