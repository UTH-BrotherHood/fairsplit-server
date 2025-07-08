import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  UpdateMeReqBody,
  ChangePasswordReqBody,
  SearchUsersReqQuery,
  UpdateUserPreferencesReqBody,
  UpdatePrivacySettingsReqBody,
  BlockUserReqBody,
  TokenPayload
} from '~/models/requests/user.requests'
import userService from '~/services/user.service'
import { USER_MESSAGES } from '~/constants/messages'
import { ObjectId } from 'mongodb'
import { OK } from '~/core/succes.response'
import userAnalyticsService from '~/services/userAnalytics.service'

// Helper to safely extract string from query params
function getStringParam(param: any): string | undefined {
  if (typeof param === 'string') return param
  if (Array.isArray(param)) return param[0]
  return undefined
}

class UserController {
  async getMe(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const user = await userService.getMe(userId)
    new OK({
      message: USER_MESSAGES.GET_ME_SUCCESSFULLY,
      data: user
    }).send(res)
  }

  async updateMe(req: Request<ParamsDictionary, any, UpdateMeReqBody>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await userService.updateMe(userId, req.body)
    new OK({
      message: USER_MESSAGES.UPDATE_ME_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async changePassword(req: Request<ParamsDictionary, any, ChangePasswordReqBody>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await userService.changePassword(userId, req.body)
    new OK({
      message: USER_MESSAGES.CHANGE_PASSWORD_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async searchUsers(req: Request<ParamsDictionary, any, any, SearchUsersReqQuery>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await userService.searchUsers(userId, req.query)
    new OK({
      message: USER_MESSAGES.SEARCH_USERS_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async getSuggestedUsers(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await userService.getSuggestedUsers(userId)
    new OK({
      message: USER_MESSAGES.GET_SUGGESTED_USERS_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async getTrendingUsers(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await userService.getTrendingUsers(userId)
    new OK({
      message: USER_MESSAGES.GET_TRENDING_USERS_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async getUserPreferences(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await userService.getUserPreferences(userId)
    new OK({
      message: USER_MESSAGES.GET_USER_PREFERENCES_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async updatePreferences(req: Request<ParamsDictionary, any, UpdateUserPreferencesReqBody>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await userService.updatePreferences(userId, req.body)
    new OK({
      message: USER_MESSAGES.PREFERENCES_UPDATED_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async getPrivacySettings(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await userService.getPrivacySettings(userId)
    new OK({
      message: USER_MESSAGES.GET_PRIVACY_SETTINGS_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async updatePrivacySettings(req: Request<ParamsDictionary, any, UpdatePrivacySettingsReqBody>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await userService.updatePrivacySettings(userId, req.body)
    new OK({
      message: USER_MESSAGES.PRIVACY_SETTINGS_UPDATED_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async blockUser(req: Request<ParamsDictionary, any, BlockUserReqBody>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const targetUserId = new ObjectId(req.params.userId)
    const result = await userService.blockUser(userId, targetUserId, req.body.reason)
    new OK({
      message: USER_MESSAGES.USER_BLOCKED_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async unblockUser(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const targetUserId = new ObjectId(req.params.userId)
    const result = await userService.unblockUser(userId, targetUserId)
    new OK({
      message: USER_MESSAGES.USER_UNBLOCKED_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async getBlockedUsers(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await userService.getBlockedUsers(userId)
    new OK({
      message: USER_MESSAGES.GET_BLOCKED_USERS_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async sendFriendRequest(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const targetUserId = new ObjectId(req.params.userId)
    const result = await userService.sendFriendRequest(userId, targetUserId)
    new OK({
      message: USER_MESSAGES.FRIEND_REQUEST_SENT,
      data: result
    }).send(res)
  }

  async acceptFriendRequest(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const requestId = new ObjectId(req.params.requestId)
    const result = await userService.acceptFriendRequest(userId, requestId)
    new OK({
      message: USER_MESSAGES.FRIEND_REQUEST_ACCEPTED,
      data: result
    }).send(res)
  }

  async rejectFriendRequest(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const requestId = new ObjectId(req.params.requestId)
    const result = await userService.rejectFriendRequest(userId, requestId)
    new OK({
      message: USER_MESSAGES.FRIEND_REQUEST_REJECTED,
      data: result
    }).send(res)
  }

  async cancelFriendRequest(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const requestId = new ObjectId(req.params.requestId)
    const result = await userService.cancelFriendRequest(userId, requestId)
    new OK({
      message: USER_MESSAGES.FRIEND_REQUEST_CANCELLED,
      data: result
    }).send(res)
  }

  async getFriends(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await userService.getFriends(userId)
    new OK({
      message: USER_MESSAGES.GET_FRIENDS_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async getFriendRequests(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await userService.getFriendRequests(userId)
    new OK({
      message: USER_MESSAGES.GET_FRIEND_REQUESTS_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async getUserActivity(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await userService.getUserActivity(userId)
    new OK({
      message: USER_MESSAGES.GET_USER_ACTIVITY_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async getUserStatistics(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await userService.getUserStatistics(userId)
    new OK({
      message: USER_MESSAGES.GET_USER_STATISTICS_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async getAnalyticsOverview(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const groupId = getStringParam(req.query.groupId)
    const result = await userAnalyticsService.getUserAnalyticsOverview(userId, groupId)
    new OK({
      message: 'Lấy tổng quan chi tiêu thành công',
      data: result
    }).send(res)
  }

  async getAnalyticsMonthly(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const groupId = getStringParam(req.query.groupId)
    const year = getStringParam(req.query.year)
    const result = await userAnalyticsService.getUserAnalyticsMonthly(userId, groupId, year)
    new OK({
      message: 'Lấy thống kê theo tháng thành công',
      data: result
    }).send(res)
  }

  async getAnalyticsYearly(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const groupId = getStringParam(req.query.groupId)
    const result = await userAnalyticsService.getUserAnalyticsYearly(userId, groupId)
    new OK({
      message: 'Lấy thống kê theo năm thành công',
      data: result
    }).send(res)
  }

  async getAnalyticsCompare(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const groupId = getStringParam(req.query.groupId)
    const monthStr = getStringParam(req.query.month)
    const yearStr = getStringParam(req.query.year)
    if (!monthStr || !yearStr) {
      return res.status(400).json({ message: 'month và year là bắt buộc' })
    }
    const month = parseInt(monthStr, 10)
    const year = parseInt(yearStr, 10)
    const result = await userAnalyticsService.compareUserAnalytics(userId, groupId, month, year)
    new OK({
      message: 'So sánh chi tiêu thành công',
      data: result
    }).send(res)
  }
}

const userController = new UserController()
export default userController
