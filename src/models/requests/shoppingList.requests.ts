import { ListStatus } from '../schemas/shoppingList.schema'

export interface CreateShoppingListReqBody {
  name: string
  description?: string
  tags?: string[]
  dueDate?: string
}

export interface UpdateShoppingListReqBody {
  name?: string
  description?: string
  status?: ListStatus
  tags?: string[]
  dueDate?: string
}

export interface AddShoppingListItemReqBody {
  name: string
  quantity: number
  unit?: string
  estimatedPrice?: number
  note?: string
  category?: string
}

export interface UpdateShoppingListItemReqBody {
  name?: string
  quantity?: number
  unit?: string
  estimatedPrice?: number
  note?: string
  isPurchased?: boolean
  purchasedBy?: string
  purchasedAt?: string
  category?: string
}
