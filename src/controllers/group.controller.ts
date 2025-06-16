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

export const createGroupController = async (req: Request<ParamsDictionary, any, CreateGroupReqBody>, res: Response) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const result = await groupService.createGroup(user_id, req.body)
  return res.status(httpStatusCode.CREATED).json({
    message: GROUP_MESSAGES.CREATE_GROUP_SUCCESSFULLY,
    result
  })
}

export const getMyGroupsController = async (req: Request, res: Response) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const result = await groupService.getMyGroups(user_id)
  return res.json({
    message: GROUP_MESSAGES.GET_GROUPS_SUCCESSFULLY,
    result
  })
}

export const getGroupByIdController = async (req: Request, res: Response) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const { groupId } = req.params
  const result = await groupService.getGroupById(user_id, groupId)
  return res.json({
    message: GROUP_MESSAGES.GET_GROUP_SUCCESSFULLY,
    result
  })
}

export const updateGroupController = async (
  req: Request<ParamsDictionary & { groupId: string }, any, UpdateGroupReqBody>,
  res: Response
) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const { groupId } = req.params
  const result = await groupService.updateGroup(user_id, groupId, req.body)
  return res.json({
    message: GROUP_MESSAGES.UPDATE_GROUP_SUCCESSFULLY,
    result
  })
}

export const deleteGroupController = async (req: Request, res: Response) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const { groupId } = req.params
  const result = await groupService.deleteGroup(user_id, groupId)
  return res.json({
    message: GROUP_MESSAGES.DELETE_GROUP_SUCCESSFULLY,
    result
  })
}

export const addMemberController = async (
  req: Request<ParamsDictionary & { groupId: string }, any, AddMemberReqBody>,
  res: Response
) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const { groupId } = req.params
  const result = await groupService.addMember(user_id, groupId, req.body)
  return res.json({
    message: GROUP_MESSAGES.ADD_MEMBER_SUCCESSFULLY,
    result
  })
}

export const updateMemberController = async (
  req: Request<ParamsDictionary & { groupId: string; userId: string }, any, UpdateMemberReqBody>,
  res: Response
) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const { groupId, userId } = req.params
  const result = await groupService.updateMember(user_id, groupId, userId, req.body)
  return res.json({
    message: GROUP_MESSAGES.UPDATE_MEMBER_SUCCESSFULLY,
    result
  })
}

export const removeMemberController = async (req: Request, res: Response) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const { groupId, userId } = req.params
  const result = await groupService.removeMember(user_id, groupId, userId)
  return res.json({
    message: GROUP_MESSAGES.REMOVE_MEMBER_SUCCESSFULLY,
    result
  })
}

const groupController = {
  createGroup: createGroupController,
  getMyGroups: getMyGroupsController,
  getGroupById: getGroupByIdController,
  updateGroup: updateGroupController,
  deleteGroup: deleteGroupController,
  addMember: addMemberController,
  updateMember: updateMemberController,
  removeMember: removeMemberController
}

export default groupController
