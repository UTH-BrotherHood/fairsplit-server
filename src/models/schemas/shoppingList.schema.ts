import { ObjectId } from 'mongodb'

export enum ListStatus {
  Active = 'active',
  Completed = 'completed',
  Archived = 'archived'
}

export interface IShoppingListItem {
  _id?: ObjectId
  name: string
  quantity: number
  unit?: string
  estimatedPrice?: number
  note?: string
  isPurchased: boolean
  purchasedBy?: ObjectId
  purchasedAt?: Date
  category?: string
}

export interface IShoppingList {
  _id?: ObjectId
  groupId: ObjectId
  name: string
  description?: string
  status: ListStatus
  items: IShoppingListItem[]
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  totalEstimatedPrice?: number
  totalActualPrice?: number
  dueDate?: Date
  tags?: string[]
}
