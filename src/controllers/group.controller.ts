import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TokenPayload } from '~/models/requests/user.requests'
import {
  CreateGroupReqBody,
  UpdateGroupReqBody,
  AddMemberReqBody,
  UpdateMemberReqBody,
  GetMyGroupsQuery
} from '~/models/requests/group.requests'
import groupService from '~/services/group.service'
import { GROUP_MESSAGES } from '~/constants/messages'
import { OK } from '~/core/succes.response'

class GroupController {
  async createGroup(req: Request<ParamsDictionary, any, CreateGroupReqBody>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await groupService.createGroup(userId, req.body)
    new OK({
      message: GROUP_MESSAGES.CREATE_GROUP_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async getMyGroups(req: Request<any, any, any, GetMyGroupsQuery>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await groupService.getMyGroups(userId, req.query)

    return res.json({
      message: GROUP_MESSAGES.GET_GROUPS_SUCCESSFULLY,
      ...result
    })
  }

  async getGroupById(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { groupId } = req.params
    const result = await groupService.getGroupById(userId, groupId)
    return res.json({
      message: GROUP_MESSAGES.GET_GROUP_SUCCESSFULLY,
      result
    })
  }

  async updateGroup(req: Request<ParamsDictionary & { groupId: string }, any, UpdateGroupReqBody>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { groupId } = req.params
    const result = await groupService.updateGroup(userId, groupId, req.body)

    new OK({
      message: GROUP_MESSAGES.UPDATE_GROUP_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async deleteGroup(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { groupId } = req.params
    const result = await groupService.deleteGroup(userId, groupId)
    return res.json({
      message: GROUP_MESSAGES.DELETE_GROUP_SUCCESSFULLY,
      result
    })
  }

  async addMember(req: Request<ParamsDictionary & { groupId: string }, any, AddMemberReqBody>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { groupId } = req.params
    const result = await groupService.addMember(userId, groupId, req.body)
    return res.json({
      message: GROUP_MESSAGES.ADD_MEMBER_SUCCESSFULLY,
      result
    })
  }

  async updateMember(
    req: Request<ParamsDictionary & { groupId: string; userId: string }, any, UpdateMemberReqBody>,
    res: Response
  ) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { groupId, memberId } = req.params
    const result = await groupService.updateMember(userId, groupId, memberId, req.body)
    return res.json({
      message: GROUP_MESSAGES.UPDATE_MEMBER_SUCCESSFULLY,
      result
    })
  }

  async removeMember(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { groupId, memberId } = req.params
    const result = await groupService.removeMember(userId, groupId, memberId)
    return res.json({
      message: GROUP_MESSAGES.REMOVE_MEMBER_SUCCESSFULLY,
      result
    })
  }

  async getGroupParticipants(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { groupId } = req.params
    const result = await groupService.getGroupParticipants(userId, groupId)
    return res.json({
      message: GROUP_MESSAGES.GET_GROUP_PARTICIPANTS_SUCCESSFULLY,
      result
    })
  }
}

const groupController = new GroupController()
export default groupController
