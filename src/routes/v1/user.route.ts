import { Router } from 'express'
import { uploadSingle } from '~/config/upload/multer'
import adminController from '~/controllers/admin.controller'
import userController from '~/controllers/user.controller'
import { accessTokenValidation } from '~/middlewares/auth.middlewares'
import { uploadMiddleware } from '~/middlewares/upload.middlware'
import {
  changePasswordValidation,
  userPreferencesValidation,
  updatePrivacySettingsValidation,
  // blockUserValidation,
  updateProfileValidation
} from '~/middlewares/user.middlewares'
import { wrapRequestHandler } from '~/utils/wrapHandler'

const userRoute = Router()

/**
 * Profile Management Routes
 */
userRoute.get('/me', accessTokenValidation, wrapRequestHandler(userController.getMe))
userRoute.patch(
  '/me',
  uploadSingle('avatar'),
  uploadMiddleware,
  accessTokenValidation,
  updateProfileValidation,
  wrapRequestHandler(userController.updateMe)
)
userRoute.patch(
  '/change-password',
  accessTokenValidation,
  changePasswordValidation,
  wrapRequestHandler(userController.changePassword)
)

/**
 * User Search and Discovery
 */
userRoute.get('/search', accessTokenValidation, wrapRequestHandler(userController.searchUsers))
userRoute.get('/suggestions', accessTokenValidation, wrapRequestHandler(userController.getSuggestedUsers))
userRoute.get('/trending', accessTokenValidation, wrapRequestHandler(userController.getTrendingUsers))

/**
 * User Preferences
 */
userRoute.get('/preferences', accessTokenValidation, wrapRequestHandler(userController.getUserPreferences))
userRoute.patch(
  '/preferences',
  accessTokenValidation,
  userPreferencesValidation,
  wrapRequestHandler(userController.updatePreferences)
)

userRoute.get('/categories', wrapRequestHandler(adminController.getAllCategories))

/**
 * Privacy Settings
 */
userRoute.get('/privacy', accessTokenValidation, wrapRequestHandler(userController.getPrivacySettings))
userRoute.patch(
  '/privacy',
  accessTokenValidation,
  updatePrivacySettingsValidation,
  wrapRequestHandler(userController.updatePrivacySettings)
)

/**
 * User Relationships
 */
userRoute.get('/friends', accessTokenValidation, wrapRequestHandler(userController.getFriends))
userRoute.post('/friends/:userId', accessTokenValidation, wrapRequestHandler(userController.sendFriendRequest))
userRoute.patch(
  '/friends/:userId/accept',
  accessTokenValidation,
  wrapRequestHandler(userController.acceptFriendRequest)
)
userRoute.patch(
  '/friends/:userId/reject',
  accessTokenValidation,
  wrapRequestHandler(userController.rejectFriendRequest)
)
userRoute.delete('/friends/:requestId', accessTokenValidation, wrapRequestHandler(userController.cancelFriendRequest))

/**
 * User Blocking
 */
// userRoute.post('/block', accessTokenValidation, blockUserValidation, wrapRequestHandler(userController.blockUser))
// userRoute.delete('/block/:userId', accessTokenValidation, wrapRequestHandler(userController.unblockUser))
// userRoute.get('/blocked', accessTokenValidation, wrapRequestHandler(userController.getBlockedUsers))

/**
 * Activity and Statistics
 */
userRoute.get('/activity', accessTokenValidation, wrapRequestHandler(userController.getUserActivity))
userRoute.get('/statistics', accessTokenValidation, wrapRequestHandler(userController.getUserStatistics))

/**
 * User Analytics
 */
userRoute.get('/analytics/overview', accessTokenValidation, wrapRequestHandler(userController.getAnalyticsOverview))
userRoute.get('/analytics/monthly', accessTokenValidation, wrapRequestHandler(userController.getAnalyticsMonthly))
userRoute.get('/analytics/yearly', accessTokenValidation, wrapRequestHandler(userController.getAnalyticsYearly))
userRoute.get('/analytics/compare', accessTokenValidation, wrapRequestHandler(userController.getAnalyticsCompare))

export default userRoute
