import { ObjectId } from 'mongodb'
import { ListStatus } from '~/models/schemas/shoppingList.schema'
import databaseServices from './database.services'
import { PaginationUtils } from '~/utils/pagination.utils'
import { ErrorWithStatus } from '~/utils/error.utils'
import { GROUP_MESSAGES } from '~/constants/messages'
import httpStatusCode from '~/core/statusCodes'
import { CreateShoppingListReqBody } from '~/models/requests/shoppingList.requests'

export class ShoppingListService {
  private async checkGroupMembership(userId: string, groupId: string) {
    const group = await databaseServices.groups.findOne({
      _id: new ObjectId(groupId),
      'members.userId': new ObjectId(userId),
      isArchived: false
    })

    if (!group) {
      throw new ErrorWithStatus({
        message: GROUP_MESSAGES.USER_NOT_IN_GROUP,
        status: httpStatusCode.FORBIDDEN
      })
    }

    return group
  }
  async createShoppingList(userId: string, groupId: string, payload: CreateShoppingListReqBody) {
    await this.checkGroupMembership(userId, groupId)

    const doc = {
      groupId: new ObjectId(groupId),
      name: payload.name,
      description: payload.description,
      tags: payload.tags || [],
      dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
      status: ListStatus.Active,
      items: [],
      totalEstimatedPrice: 0,
      totalActualPrice: 0,
      createdBy: new ObjectId(userId),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await databaseServices.shoppingLists.insertOne(doc)
    return { ...doc, _id: result.insertedId }
  }

  async getShoppingLists(userId: string, groupId: string, query: any) {
    await this.checkGroupMembership(userId, groupId)

    const mongoQuery = {
      groupId: new ObjectId(groupId),
      ...(query.status && { status: query.status }),
      ...(query.search && { name: { $regex: query.search, $options: 'i' } })
    }

    const { page, limit } = PaginationUtils.normalizeQueryParams(query)
    const { items, pagination } = await PaginationUtils.paginate(
      databaseServices.shoppingLists,
      mongoQuery,
      { sort: { updatedAt: -1 } },
      { page, limit }
    )

    return { items, pagination }
  }

  async getShoppingListById(userId: string, listId: string) {
    const list = await databaseServices.shoppingLists.findOne({ _id: new ObjectId(listId) })
    if (!list) throw new ErrorWithStatus({ message: 'Danh sách không tồn tại', status: 404 })

    await this.checkGroupMembership(userId, list.groupId.toString())
    return list
  }

  async updateShoppingList(userId: string, listId: string, payload: any) {
    const list = await databaseServices.shoppingLists.findOne({ _id: new ObjectId(listId) })
    if (!list) throw new ErrorWithStatus({ message: 'Danh sách không tồn tại', status: 404 })
    await this.checkGroupMembership(userId, list.groupId.toString())

    const updateData = {
      ...(payload.name && { name: payload.name }),
      ...(payload.description && { description: payload.description }),
      ...(payload.status && { status: payload.status }),
      ...(payload.tags && { tags: payload.tags }),
      ...(payload.dueDate && { dueDate: new Date(payload.dueDate) }),
      updatedAt: new Date()
    }

    await databaseServices.shoppingLists.updateOne({ _id: list._id }, { $set: updateData })
    return { ...list, ...updateData }
  }

  async deleteShoppingList(userId: string, listId: string) {
    const list = await databaseServices.shoppingLists.findOne({ _id: new ObjectId(listId) })
    if (!list) throw new ErrorWithStatus({ message: 'Danh sách không tồn tại', status: 404 })
    await this.checkGroupMembership(userId, list.groupId.toString())

    await databaseServices.shoppingLists.deleteOne({ _id: list._id })
  }

  async addItem(userId: string, listId: string, payload: any) {
    const list = await databaseServices.shoppingLists.findOne({ _id: new ObjectId(listId) })
    if (!list) throw new ErrorWithStatus({ message: 'Danh sách không tồn tại', status: 404 })
    await this.checkGroupMembership(userId, list.groupId.toString())

    const newItem = {
      _id: new ObjectId(),
      name: payload.name,
      quantity: payload.quantity,
      unit: payload.unit,
      estimatedPrice: payload.estimatedPrice,
      note: payload.note,
      category: payload.category,
      isPurchased: false
    }

    await databaseServices.shoppingLists.updateOne(
      { _id: list._id },
      { $push: { items: newItem }, $set: { updatedAt: new Date() } }
    )
    return newItem
  }

  async addItems(userId: string, listId: string, items: any[]) {
    const list = await databaseServices.shoppingLists.findOne({ _id: new ObjectId(listId) })
    if (!list) throw new ErrorWithStatus({ message: 'Danh sách không tồn tại', status: 404 })
    await this.checkGroupMembership(userId, list.groupId.toString())

    const newItems = items.map((item) => ({
      _id: new ObjectId(),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      estimatedPrice: item.estimatedPrice,
      note: item.note,
      category: item.category,
      isPurchased: false
    }))

    await databaseServices.shoppingLists.updateOne(
      { _id: list._id },
      { $push: { items: { $each: newItems } }, $set: { updatedAt: new Date() } }
    )
    return newItems
  }

  async updateItem(userId: string, listId: string, itemId: string, payload: any) {
    const list = await databaseServices.shoppingLists.findOne({ _id: new ObjectId(listId) })
    if (!list) throw new ErrorWithStatus({ message: 'Danh sách không tồn tại', status: 404 })
    await this.checkGroupMembership(userId, list.groupId.toString())

    const updateFields: Record<string, any> = {}
    if (payload.name !== undefined) updateFields['items.$[i].name'] = payload.name
    if (payload.quantity !== undefined) updateFields['items.$[i].quantity'] = payload.quantity
    if (payload.unit !== undefined) updateFields['items.$[i].unit'] = payload.unit
    if (payload.estimatedPrice !== undefined) updateFields['items.$[i].estimatedPrice'] = payload.estimatedPrice
    if (payload.note !== undefined) updateFields['items.$[i].note'] = payload.note
    if (payload.category !== undefined) updateFields['items.$[i].category'] = payload.category
    if (payload.isPurchased !== undefined) updateFields['items.$[i].isPurchased'] = payload.isPurchased
    if (payload.purchasedBy !== undefined) updateFields['items.$[i].purchasedBy'] = new ObjectId(payload.purchasedBy)
    if (payload.purchasedAt !== undefined) updateFields['items.$[i].purchasedAt'] = new Date(payload.purchasedAt)

    await databaseServices.shoppingLists.updateOne(
      { _id: list._id },
      { $set: updateFields, $currentDate: { updatedAt: true } },
      { arrayFilters: [{ 'i._id': new ObjectId(itemId) }] }
    )

    const updatedList = await databaseServices.shoppingLists.findOne({ _id: list._id })
    const updatedItem = updatedList?.items.find((i) => i._id && i._id.toString() === itemId)
    return updatedItem
  }

  async removeItem(userId: string, listId: string, itemId: string) {
    const list = await databaseServices.shoppingLists.findOne({ _id: new ObjectId(listId) })
    if (!list) throw new ErrorWithStatus({ message: 'Danh sách không tồn tại', status: 404 })
    await this.checkGroupMembership(userId, list.groupId.toString())

    await databaseServices.shoppingLists.updateOne(
      { _id: list._id },
      { $pull: { items: { _id: new ObjectId(itemId) } }, $set: { updatedAt: new Date() } }
    )
  }

  async markItemPurchased(userId: string, listId: string, itemId: string) {
    const list = await databaseServices.shoppingLists.findOne({ _id: new ObjectId(listId) })
    if (!list) throw new ErrorWithStatus({ message: 'Danh sách không tồn tại', status: 404 })
    await this.checkGroupMembership(userId, list.groupId.toString())

    await databaseServices.shoppingLists.updateOne(
      { _id: list._id },
      {
        $set: {
          'items.$[i].isPurchased': true,
          'items.$[i].purchasedBy': new ObjectId(userId),
          'items.$[i].purchasedAt': new Date(),
          updatedAt: new Date()
        }
      },
      { arrayFilters: [{ 'i._id': new ObjectId(itemId) }] }
    )
    const updatedList = await databaseServices.shoppingLists.findOne({ _id: list._id })
    const updatedItem = updatedList?.items.find((i) => i._id && i._id.toString() === itemId)
    return updatedItem
  }

  async markListCompleted(userId: string, listId: string) {
    const list = await databaseServices.shoppingLists.findOne({ _id: new ObjectId(listId) })
    if (!list) throw new ErrorWithStatus({ message: 'Danh sách không tồn tại', status: 404 })
    await this.checkGroupMembership(userId, list.groupId.toString())

    // Đánh dấu tất cả item chưa purchased thành purchased
    await databaseServices.shoppingLists.updateOne(
      { _id: list._id },
      {
        $set: {
          status: ListStatus.Completed,
          completedAt: new Date(),
          updatedAt: new Date(),
          'items.$[i].isPurchased': true,
          'items.$[i].purchasedBy': new ObjectId(userId),
          'items.$[i].purchasedAt': new Date()
        }
      },
      {
        arrayFilters: [{ 'i.isPurchased': { $ne: true } }]
      }
    )

    return { ...list, status: ListStatus.Completed, completedAt: new Date() }
  }

  async markListArchived(userId: string, listId: string) {
    const list = await databaseServices.shoppingLists.findOne({ _id: new ObjectId(listId) })
    if (!list) throw new ErrorWithStatus({ message: 'Danh sách không tồn tại', status: 404 })
    await this.checkGroupMembership(userId, list.groupId.toString())

    await databaseServices.shoppingLists.updateOne(
      { _id: list._id },
      { $set: { status: ListStatus.Archived, updatedAt: new Date() } }
    )
    return { ...list, status: ListStatus.Archived }
  }

  async markListActive(userId: string, listId: string) {
    const list = await databaseServices.shoppingLists.findOne({ _id: new ObjectId(listId) })
    if (!list) throw new ErrorWithStatus({ message: 'Danh sách không tồn tại', status: 404 })
    await this.checkGroupMembership(userId, list.groupId.toString())

    await databaseServices.shoppingLists.updateOne(
      { _id: list._id },
      { $set: { status: ListStatus.Active, updatedAt: new Date() } }
    )
    return { ...list, status: ListStatus.Active }
  }
}

export const shoppingListService = new ShoppingListService()
