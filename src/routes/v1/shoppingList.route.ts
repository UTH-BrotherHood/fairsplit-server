import { Router } from 'express'
import { shoppingListController } from '~/controllers/shoppingList.controller'
import { accessTokenValidation } from '~/middlewares/auth.middlewares'
import {
  addShoppingListItemValidation,
  createShoppingListValidation,
  updateShoppingListItemValidation,
  updateShoppingListValidation
} from '~/middlewares/shoppingList.middlewares'
import { wrapRequestHandler } from '~/utils/wrapHandler'

const shoppingListRoute = Router()

// List
shoppingListRoute.post(
  '/groups/:groupId',
  accessTokenValidation,
  createShoppingListValidation,
  wrapRequestHandler(shoppingListController.createShoppingList)
)

shoppingListRoute.get(
  '/groups/:groupId',
  accessTokenValidation,
  wrapRequestHandler(shoppingListController.getShoppingLists)
)

shoppingListRoute.get('/:listId', accessTokenValidation, wrapRequestHandler(shoppingListController.getShoppingListById))

shoppingListRoute.patch(
  '/:listId',
  accessTokenValidation,
  updateShoppingListValidation,
  wrapRequestHandler(shoppingListController.updateShoppingList)
)

shoppingListRoute.delete(
  '/:listId',
  accessTokenValidation,
  wrapRequestHandler(shoppingListController.deleteShoppingList)
)

// Item
shoppingListRoute.post(
  '/:listId/items',
  accessTokenValidation,
  addShoppingListItemValidation,
  wrapRequestHandler(shoppingListController.addItem)
)

// Sử dụng middleware này cho các route cần kiểm tra item tồn tại
shoppingListRoute.patch(
  '/:listId/items/:itemId',
  accessTokenValidation,
  updateShoppingListItemValidation,
  wrapRequestHandler(shoppingListController.updateItem)
)

shoppingListRoute.delete(
  '/:listId/items/:itemId',
  accessTokenValidation,
  wrapRequestHandler(shoppingListController.removeItem)
)

shoppingListRoute.patch(
  '/:listId/items/:itemId/mark-purchased',
  accessTokenValidation,
  wrapRequestHandler(shoppingListController.markItemPurchased)
)

// kiểm tra nếu tất cả items trong list đều đã purchased thì đánh dấu list là completed, hoặc nếu gọi endpoint này thì sẽ đánh dấu list là completed
shoppingListRoute.patch(
  '/:listId/mark-completed',
  accessTokenValidation,
  wrapRequestHandler(shoppingListController.markListCompleted)
)

shoppingListRoute.patch(
  '/:listId/mark-archived',
  accessTokenValidation,
  wrapRequestHandler(shoppingListController.markListArchived)
)
shoppingListRoute.patch(
  '/:listId/mark-active',
  accessTokenValidation,
  wrapRequestHandler(shoppingListController.markListActive)
)

export default shoppingListRoute
