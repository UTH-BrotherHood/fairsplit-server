import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TokenPayload } from '~/models/requests/user.requests'
import {
  CreateGroupReqBody,
  UpdateGroupReqBody,
  AddMemberReqBody,
  UpdateMemberReqBody
} from '~/models/requests/group.requests'
import groupService from '~/services/group.service'
import { GROUP_MESSAGES } from '~/constants/messages'
import { httpStatusCode } from '~/core/httpStatusCode'

class GroupController {
  async createGroup(req: Request<ParamsDictionary, any, CreateGroupReqBody>, res: Response) {
    const { user_id } = req.decodedAuthorization as TokenPayload
    const result = await groupService.createGroup(user_id, req.body)
    return res.status(httpStatusCode.CREATED).json({
      message: GROUP_MESSAGES.CREATE_GROUP_SUCCESSFULLY,
      result
    })
  }

  async getMyGroups(req: Request, res: Response) {
    const { user_id } = req.decodedAuthorization as TokenPayload
    const result = await groupService.getMyGroups(user_id)
    return res.json({
      message: GROUP_MESSAGES.GET_GROUPS_SUCCESSFULLY,
      result
    })
  }

  async getGroupById(req: Request, res: Response) {
    const { user_id } = req.decodedAuthorization as TokenPayload
    const { groupId } = req.params
    const result = await groupService.getGroupById(user_id, groupId)
    return res.json({
      message: GROUP_MESSAGES.GET_GROUP_SUCCESSFULLY,
      result
    })
  }

  async updateGroup(req: Request<ParamsDictionary & { groupId: string }, any, UpdateGroupReqBody>, res: Response) {
    const { user_id } = req.decodedAuthorization as TokenPayload
    const { groupId } = req.params
    const result = await groupService.updateGroup(user_id, groupId, req.body)
    return res.json({
      message: GROUP_MESSAGES.UPDATE_GROUP_SUCCESSFULLY,
      result
    })
  }

  async deleteGroup(req: Request, res: Response) {
    const { user_id } = req.decodedAuthorization as TokenPayload
    const { groupId } = req.params
    const result = await groupService.deleteGroup(user_id, groupId)
    return res.json({
      message: GROUP_MESSAGES.DELETE_GROUP_SUCCESSFULLY,
      result
    })
  }

  async addMember(req: Request<ParamsDictionary & { groupId: string }, any, AddMemberReqBody>, res: Response) {
    const { user_id } = req.decodedAuthorization as TokenPayload
    const { groupId } = req.params
    const result = await groupService.addMember(user_id, groupId, req.body)
    return res.json({
      message: GROUP_MESSAGES.ADD_MEMBER_SUCCESSFULLY,
      result
    })
  }

  async updateMember(
    req: Request<ParamsDictionary & { groupId: string; userId: string }, any, UpdateMemberReqBody>,
    res: Response
  ) {
    const { user_id } = req.decodedAuthorization as TokenPayload
    const { groupId, userId } = req.params
    const result = await groupService.updateMember(user_id, groupId, userId, req.body)
    return res.json({
      message: GROUP_MESSAGES.UPDATE_MEMBER_SUCCESSFULLY,
      result
    })
  }

  async removeMember(req: Request, res: Response) {
    const { user_id } = req.decodedAuthorization as TokenPayload
    const { groupId, userId } = req.params
    const result = await groupService.removeMember(user_id, groupId, userId)
    return res.json({
      message: GROUP_MESSAGES.REMOVE_MEMBER_SUCCESSFULLY,
      result
    })
  }
}

const groupController = new GroupController()
export default groupController
