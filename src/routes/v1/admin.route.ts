import { Router } from 'express'
import adminController from '~/controllers/admin.controller'
import {
  adminLoginValidation,
  adminAccessTokenValidation,
  systemSettingsValidation,
  projectStatusValidation,
  notificationMarkReadValidation,
  adminRefreshTokenValidation,
  categoryValidation,
  billStatusValidation,
  getAllUsersValidation,
  bulkUpdateUserStatusValidation,
  bulkDeleteUsersValidation,
  bulkDeleteCategoriesValidation,
  bulkDeleteBillsValidation,
  bulkDeleteGroupsValidation,
  updateGroupStatusValidation,
  bulkDeleteShoppingListsValidation,
  bulkDeleteShoppingListItemsValidation
} from '~/middlewares/admin.middlewares'
import { wrapRequestHandler } from '~/utils/wrapHandler'

/*=================================================ADMIN ROUTES=================================================*/

const adminRoute = Router()

/* ========================HEALTH CHECK ROUTE======================== */
adminRoute.get('/health', wrapRequestHandler(adminController.healthStatusGET))

/* ========================DASHBOARD ROUTE======================== */
adminRoute.get('/', adminAccessTokenValidation, wrapRequestHandler(adminController.adminDashboardGET))

/* ========================LOGIN & LOGOUT ROUTES======================== */
adminRoute.post('/login', adminLoginValidation, wrapRequestHandler(adminController.login))
adminRoute.post('/logout', adminAccessTokenValidation, wrapRequestHandler(adminController.logout))
adminRoute.post('/refresh-token', adminRefreshTokenValidation, wrapRequestHandler(adminController.refreshToken))

/* ========================SYSTEM SETTINGS ROUTES======================== */
adminRoute.get('/settings', adminAccessTokenValidation, wrapRequestHandler(adminController.getSystemSettings))
adminRoute.put(
  '/settings',
  adminAccessTokenValidation,
  systemSettingsValidation,
  wrapRequestHandler(adminController.updateSystemSettings)
)

/* ========================NOTIFICATIONS ROUTES======================== */
adminRoute.get('/notifications', adminAccessTokenValidation, wrapRequestHandler(adminController.getAllNotifications))
adminRoute.put(
  '/notifications/:notificationId/read',
  adminAccessTokenValidation,
  notificationMarkReadValidation,
  wrapRequestHandler(adminController.markNotificationAsRead)
)

/* ========================PROJECT MANAGEMENT ROUTES======================== */
adminRoute.get('/project', adminAccessTokenValidation, wrapRequestHandler(adminController.getProjectInfo))
adminRoute.put(
  '/project/status',
  adminAccessTokenValidation,
  projectStatusValidation,
  wrapRequestHandler(adminController.updateProjectStatus)
)
adminRoute.post('/project/backup', adminAccessTokenValidation, wrapRequestHandler(adminController.createSystemBackup))
adminRoute.get('/project/usage', adminAccessTokenValidation, wrapRequestHandler(adminController.getProjectUsage))

/* ========================SYSTEM MONITORING ROUTES======================== */
adminRoute.get(
  '/reports/performance',
  adminAccessTokenValidation,
  wrapRequestHandler(adminController.getSystemPerformance)
)
adminRoute.get('/reports/errors', adminAccessTokenValidation, wrapRequestHandler(adminController.getSystemErrors))
adminRoute.get(
  '/reports/feature-usage',
  adminAccessTokenValidation,
  wrapRequestHandler(adminController.getFeatureUsage)
)

/* ========================TRANSACTION MANAGEMENT ROUTES======================== */
adminRoute.get('/transactions', adminAccessTokenValidation, wrapRequestHandler(adminController.getAllTransactions))

/* ========================USER MANAGEMENT ROUTES======================== */
adminRoute.get(
  '/users',
  adminAccessTokenValidation,
  getAllUsersValidation,
  wrapRequestHandler(adminController.getAllUsers)
)
adminRoute.get('/users/:userId', adminAccessTokenValidation, wrapRequestHandler(adminController.getUserById))

adminRoute.patch(
  '/users/bulk/status',
  adminAccessTokenValidation,
  bulkUpdateUserStatusValidation,
  wrapRequestHandler(adminController.bulkUpdateUserStatus)
)
adminRoute.patch(
  '/users/:userId/status',
  adminAccessTokenValidation,
  wrapRequestHandler(adminController.updateUserStatus)
)

adminRoute.delete(
  '/users/bulk',
  adminAccessTokenValidation,
  bulkDeleteUsersValidation,
  wrapRequestHandler(adminController.bulkDeleteUsers)
)

adminRoute.delete('/users/:userId', adminAccessTokenValidation, wrapRequestHandler(adminController.deleteUser))

/* ========================CATEGORY MANAGEMENT ROUTES======================== */
adminRoute.get('/categories', adminAccessTokenValidation, wrapRequestHandler(adminController.getAllCategories))
adminRoute.post(
  '/categories',
  adminAccessTokenValidation,
  categoryValidation,
  wrapRequestHandler(adminController.createCategory)
)
adminRoute.put(
  '/categories/:categoryId',
  adminAccessTokenValidation,
  categoryValidation,
  wrapRequestHandler(adminController.updateCategory)
)

adminRoute.delete(
  '/categories/bulk',
  adminAccessTokenValidation,
  bulkDeleteCategoriesValidation,
  wrapRequestHandler(adminController.bulkDeleteCategories)
)

/* ========================BILL MANAGEMENT ROUTES======================== */
adminRoute.get('/bills', adminAccessTokenValidation, wrapRequestHandler(adminController.getAllBills))
adminRoute.get('/bills/:billId', adminAccessTokenValidation, wrapRequestHandler(adminController.getBillById))
adminRoute.put(
  '/bills/:billId/status',
  adminAccessTokenValidation,
  billStatusValidation,
  wrapRequestHandler(adminController.updateBillStatus)
)
adminRoute.delete('/bills/:billId', adminAccessTokenValidation, wrapRequestHandler(adminController.deleteBill))
adminRoute.delete(
  '/bills/bulk',
  adminAccessTokenValidation,
  bulkDeleteBillsValidation,
  wrapRequestHandler(adminController.bulkDeleteBills)
)

/* ========================GROUP MANAGEMENT ROUTES======================== */
adminRoute.get('/groups', adminAccessTokenValidation, wrapRequestHandler(adminController.getAllGroups))
adminRoute.get('/groups/:groupId', adminAccessTokenValidation, wrapRequestHandler(adminController.getGroupById))
adminRoute.get(
  '/groups/:groupId/members',
  adminAccessTokenValidation,
  wrapRequestHandler(adminController.getGroupMembers)
)

adminRoute.delete(
  '/groups/bulk',
  adminAccessTokenValidation,
  bulkDeleteGroupsValidation,
  wrapRequestHandler(adminController.bulkDeleteGroups)
)
adminRoute.delete('/groups/:groupId', adminAccessTokenValidation, wrapRequestHandler(adminController.deleteGroup))
adminRoute.patch(
  '/groups/:groupId/status',
  adminAccessTokenValidation,
  updateGroupStatusValidation,
  wrapRequestHandler(adminController.updateGroupStatus)
)

/* ========================SHOPPING LIST MANAGEMENT ROUTES======================== */
adminRoute.get('/shopping-lists', adminAccessTokenValidation, wrapRequestHandler(adminController.getAllShoppingLists))
adminRoute.get(
  '/shopping-lists/:listId',
  adminAccessTokenValidation,
  wrapRequestHandler(adminController.getShoppingListById)
)
adminRoute.delete(
  '/shopping-lists/bulk',
  adminAccessTokenValidation,
  bulkDeleteShoppingListsValidation,
  wrapRequestHandler(adminController.bulkDeleteShoppingLists)
)
adminRoute.delete(
  '/shopping-lists/:listId',
  adminAccessTokenValidation,
  wrapRequestHandler(adminController.deleteShoppingList)
)
adminRoute.get(
  '/shopping-lists/:listId/items',
  adminAccessTokenValidation,
  wrapRequestHandler(adminController.getShoppingListItems)
)
adminRoute.delete(
  '/shopping-lists/:listId/items/bulk',
  adminAccessTokenValidation,
  bulkDeleteShoppingListItemsValidation,
  wrapRequestHandler(adminController.bulkDeleteShoppingListItems)
)
adminRoute.delete(
  '/shopping-lists/:listId/items/:itemId',
  adminAccessTokenValidation,
  wrapRequestHandler(adminController.deleteShoppingListItem)
)

export default adminRoute
