import { Request, Response } from 'express'
import {
  CreateShoppingListReqBody,
  UpdateShoppingListReqBody,
  AddShoppingListItemReqBody,
  UpdateShoppingListItemReqBody
} from '~/models/requests/shoppingList.requests'
import { SHOPPING_LIST_MESSAGES } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/user.requests'
import { shoppingListService } from '~/services/shoppingList.service'
import { OK, CREATED } from '~/core/succes.response'

export class ShoppingListController {
  async createShoppingList(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { groupId } = req.params
    const result = await shoppingListService.createShoppingList(userId, groupId, req.body as CreateShoppingListReqBody)
    new CREATED({
      message: SHOPPING_LIST_MESSAGES.LIST_CREATED,
      data: result
    }).send(res)
  }

  async getShoppingLists(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { groupId } = req.params
    const result = await shoppingListService.getShoppingLists(userId, groupId, req.query)
    new OK({
      message: SHOPPING_LIST_MESSAGES.LIST_FETCHED,
      data: result.items
    }).send(res)
  }

  async getShoppingListById(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { listId } = req.params
    const result = await shoppingListService.getShoppingListById(userId, listId)
    new OK({
      message: SHOPPING_LIST_MESSAGES.LIST_DETAIL_FETCHED,
      data: result
    }).send(res)
  }

  async updateShoppingList(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { listId } = req.params
    const result = await shoppingListService.updateShoppingList(userId, listId, req.body as UpdateShoppingListReqBody)
    new OK({
      message: SHOPPING_LIST_MESSAGES.LIST_UPDATED,
      data: result
    }).send(res)
  }

  async deleteShoppingList(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { listId } = req.params
    await shoppingListService.deleteShoppingList(userId, listId)
    new OK({
      message: SHOPPING_LIST_MESSAGES.LIST_DELETED
    }).send(res)
  }

  async addItem(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { listId } = req.params
    const items = req.body.items
    const result = await shoppingListService.addItems(userId, listId, items)
    new CREATED({
      message: SHOPPING_LIST_MESSAGES.ITEM_ADDED,
      data: result
    }).send(res)
  }

  async updateItem(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { listId, itemId } = req.params
    const result = await shoppingListService.updateItem(
      userId,
      listId,
      itemId,
      req.body as UpdateShoppingListItemReqBody
    )
    new OK({
      message: SHOPPING_LIST_MESSAGES.ITEM_UPDATED,
      data: result
    }).send(res)
  }

  async removeItem(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { listId, itemId } = req.params
    await shoppingListService.removeItem(userId, listId, itemId)
    new OK({
      message: SHOPPING_LIST_MESSAGES.ITEM_DELETED
    }).send(res)
  }

  async markItemPurchased(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { listId, itemId } = req.params
    const result = await shoppingListService.markItemPurchased(userId, listId, itemId)
    new OK({
      message: SHOPPING_LIST_MESSAGES.ITEM_MARKED_PURCHASED,
      data: result
    }).send(res)
  }

  async markListCompleted(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { listId } = req.params
    const result = await shoppingListService.markListCompleted(userId, listId)
    new OK({
      message: SHOPPING_LIST_MESSAGES.LIST_MARKED_COMPLETED,
      data: result
    }).send(res)
  }

  async markListArchived(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { listId } = req.params
    const result = await shoppingListService.markListArchived(userId, listId)
    new OK({
      message: 'Shopping list marked as archived successfully',
      data: result
    }).send(res)
  }

  async markListActive(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { listId } = req.params
    const result = await shoppingListService.markListActive(userId, listId)
    new OK({
      message: 'Shopping list marked as active successfully',
      data: result
    }).send(res)
  }
}

export const shoppingListController = new ShoppingListController()
