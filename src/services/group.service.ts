import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/utils/error.utils'
import { GROUP_MESSAGES } from '~/constants/messages'
import { httpStatusCode } from '~/core/httpStatusCode'
import { GroupRole, IGroup } from '~/models/schemas/group.schema'
import {
  CreateGroupReqBody,
  UpdateGroupReqBody,
  AddMemberReqBody,
  UpdateMemberReqBody
} from '~/models/requests/group.requests'
import databaseService from './database.services'
import { excludeSensitiveFieldsForAnotherUser } from '~/utils/user.utils'
import { PaginationUtils } from '~/utils/pagination.utils'
import { PaginationQuery } from '~/models/interfaces/pagination.interface'
import envConfig from '~/config/env'

class GroupService {
  async createGroup(userId: string, payload: CreateGroupReqBody) {
    const members = [
      {
        userId: new ObjectId(userId),
        role: GroupRole.Owner,
        joinedAt: new Date(),
        nickname: undefined
      },
      ...(payload.members || []).map((m) => ({
        userId: new ObjectId(m.userId),
        role: m.role || GroupRole.Member,
        joinedAt: new Date(),
        nickname: m.nickname
      }))
    ]
    const group: IGroup = {
      name: payload.name,
      description: payload.description,
      avatarUrl: payload.avatarUrl,
      members,
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
      settings: {
        allowMembersInvite: payload.settings?.allowMembersInvite ?? true,
        allowMembersAddList: payload.settings?.allowMembersAddList ?? true,
        defaultSplitMethod: payload.settings?.defaultSplitMethod ?? 'equal',
        currency: payload.settings?.currency ?? 'VND'
      }
    }

    const result = await databaseService.groups.insertOne(group)
    await databaseService.users.updateOne({ _id: new ObjectId(userId) }, { $push: { groups: result.insertedId } })
    if (payload.members && payload.members.length > 0) {
      const otherUserIds = payload.members.map((m) => new ObjectId(m.userId))
      await databaseService.users.updateMany({ _id: { $in: otherUserIds } }, { $push: { groups: result.insertedId } })
    }
    return {
      ...group,
      _id: result.insertedId
    }
  }

  async getMyGroups(userId: string, query: PaginationQuery & { search?: string }) {
    const { page, limit } = PaginationUtils.normalizeQueryParams(query)

    const matchStage: any = {
      'members.userId': new ObjectId(userId),
      isArchived: false
    }
    if (query.search) {
      matchStage.name = { $regex: query.search, $options: 'i' }
    }

    const pipeline: any[] = [
      { $match: matchStage },
      { $sort: { updatedAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: envConfig.dbBillCollection,
          localField: '_id',
          foreignField: 'groupId',
          as: 'bills'
        }
      },
      {
        $lookup: {
          from: envConfig.dbBillCollection,
          let: { groupId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$groupId', '$$groupId'] }, { $eq: ['$status', 'pending'] }] } } }
          ],
          as: 'pendingBills'
        }
      },
      {
        $addFields: {
          pendingBillCount: { $size: '$pendingBills' }
        }
      },
      {
        $lookup: {
          from: envConfig.dbShoppingListCollection,
          localField: '_id',
          foreignField: 'groupId',
          as: 'shoppingLists'
        }
      },
      {
        $project: {
          pendingBills: 0 // ẩn mảng pendingBills, chỉ giữ lại count
        }
      }
    ]

    const groups = await databaseService.groups.aggregate(pipeline).toArray()

    // Lấy tất cả userId trong các group
    const uniqueUserIds = [...new Set(groups.flatMap((g: any) => g.members.map((m: any) => m.userId.toString())))]
    const users = await databaseService.users
      .find({ _id: { $in: uniqueUserIds.map((id) => new ObjectId(id)) } })
      .toArray()
    const userMap = new Map(users.map((u) => [u._id.toString(), excludeSensitiveFieldsForAnotherUser(u)]))

    const result = groups.map((group: any) => ({
      ...group,
      members: group.members.map((m: any) => ({
        ...m,
        user: userMap.get(m.userId.toString()) || null
      }))
      // pendingBillCount đã có sẵn từ pipeline
    }))

    // Đếm tổng số group để trả về pagination
    const totalItems = await databaseService.groups.countDocuments(matchStage)
    const pagination = PaginationUtils.getPaginationInfo(page, limit, totalItems)

    return {
      items: result,
      pagination
    }
  }

  async getGroupById(userId: string, groupId: string) {
    const group = await databaseService.groups.findOne({
      _id: new ObjectId(groupId),
      'members.userId': new ObjectId(userId),
      isArchived: false
    })

    if (!group) {
      throw new ErrorWithStatus({
        message: GROUP_MESSAGES.GROUP_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    // Lấy danh sách userIds từ group.members
    const userIds = group.members.map((m) => m.userId.toString())

    const users = await databaseService.users.find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } }).toArray()

    const userMap = new Map(users.map((u) => [u._id.toString(), excludeSensitiveFieldsForAnotherUser(u)]))

    const membersWithUserInfo = group.members.map((m) => ({
      ...m,
      user: userMap.get(m.userId.toString()) || null
    }))

    return {
      ...group,
      members: membersWithUserInfo
    }
  }

  private async checkGroupPermission(userId: string, groupId: string, requiredRole: GroupRole[]) {
    const group = await databaseService.groups.findOne({
      _id: new ObjectId(groupId),
      isArchived: false
    })

    if (!group) {
      throw new ErrorWithStatus({
        message: GROUP_MESSAGES.GROUP_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    const member = group.members.find((member) => member.userId.toString() === userId)
    if (!member) {
      throw new ErrorWithStatus({
        message: GROUP_MESSAGES.USER_NOT_IN_GROUP,
        status: httpStatusCode.FORBIDDEN
      })
    }

    if (!requiredRole.includes(member.role)) {
      throw new ErrorWithStatus({
        message: GROUP_MESSAGES.USER_NOT_AUTHORIZED,
        status: httpStatusCode.FORBIDDEN
      })
    }

    return group
  }

  async updateGroup(userId: string, groupId: string, payload: UpdateGroupReqBody) {
    const group = await this.checkGroupPermission(userId, groupId, [GroupRole.Owner, GroupRole.Admin])

    const updateData: Partial<IGroup> = {
      ...(payload.name && { name: payload.name }),
      ...(payload.description && { description: payload.description }),
      ...(payload.avatarUrl && { avatarUrl: payload.avatarUrl }),
      ...(payload.settings && {
        settings: {
          ...group.settings,
          ...payload.settings
        }
      }),
      updatedAt: new Date()
    }

    const result = await databaseService.groups.findOneAndUpdate(
      { _id: new ObjectId(groupId) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  }

  async deleteGroup(userId: string, groupId: string) {
    await this.checkGroupPermission(userId, groupId, [GroupRole.Owner])

    const result = await databaseService.groups.updateOne(
      { _id: new ObjectId(groupId) },
      {
        $set: {
          isArchived: true,
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount === 0) {
      throw new ErrorWithStatus({
        message: GROUP_MESSAGES.DELETE_GROUP_FAILED,
        status: httpStatusCode.INTERNAL_SERVER_ERROR
      })
    }

    // Remove group from all members
    await databaseService.users.updateMany(
      { groups: new ObjectId(groupId) },
      { $pull: { groups: new ObjectId(groupId) } }
    )

    return true
  }

  async addMember(userId: string, groupId: string, payload: AddMemberReqBody) {
    const group = await this.checkGroupPermission(userId, groupId, [GroupRole.Owner, GroupRole.Admin])

    const newMembers = payload.members.filter((newMember) => {
      return !group.members.some((existing) => existing.userId.toString() === newMember.userId)
    })

    if (newMembers.length === 0) {
      throw new ErrorWithStatus({
        message: GROUP_MESSAGES.USER_ALREADY_IN_GROUP,
        status: httpStatusCode.BAD_REQUEST
      })
    }

    const membersToAdd = newMembers.map((m) => ({
      userId: new ObjectId(m.userId),
      role: m.role || GroupRole.Member,
      nickname: m.nickname,
      joinedAt: new Date()
    }))

    const result = await databaseService.groups.findOneAndUpdate(
      { _id: new ObjectId(groupId) },
      {
        $push: { members: { $each: membersToAdd } },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    )

    await databaseService.users.updateMany(
      { _id: { $in: membersToAdd.map((m) => m.userId) } },
      { $addToSet: { groups: new ObjectId(groupId) } }
    )

    return result
  }

  async updateMember(userId: string, groupId: string, memberId: string, payload: UpdateMemberReqBody) {
    const group = await this.checkGroupPermission(userId, groupId, [GroupRole.Owner, GroupRole.Admin])

    const memberToUpdate = group.members.find((member) => member.userId.toString() === memberId)
    if (!memberToUpdate) {
      throw new ErrorWithStatus({
        message: GROUP_MESSAGES.MEMBER_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    if (memberToUpdate.role === GroupRole.Owner) {
      throw new ErrorWithStatus({
        message: GROUP_MESSAGES.CANNOT_UPDATE_OWNER,
        status: httpStatusCode.FORBIDDEN
      })
    }

    const currentMember = group.members.find((member) => member.userId.toString() === userId)
    if (currentMember?.role === GroupRole.Admin && payload.role === GroupRole.Admin) {
      throw new ErrorWithStatus({
        message: GROUP_MESSAGES.ADMIN_CANNOT_MODIFY_ADMIN,
        status: httpStatusCode.FORBIDDEN
      })
    }

    const updateData: any = {
      'members.$.updatedAt': new Date()
    }

    if (payload.role) {
      updateData['members.$.role'] = payload.role
    }

    if (payload.nickname) {
      updateData['members.$.nickname'] = payload.nickname
    }

    const result = await databaseService.groups.findOneAndUpdate(
      {
        _id: new ObjectId(groupId),
        'members.userId': new ObjectId(memberId)
      },
      {
        $set: updateData
      },
      { returnDocument: 'after' }
    )

    return result
  }

  async removeMember(userId: string, groupId: string, memberId: string) {
    const group = await this.checkGroupPermission(userId, groupId, [GroupRole.Owner, GroupRole.Admin])

    const memberToRemove = group.members.find((member) => member.userId.toString() === memberId)
    if (!memberToRemove) {
      throw new ErrorWithStatus({
        message: GROUP_MESSAGES.MEMBER_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    if (memberToRemove.role === GroupRole.Owner) {
      throw new ErrorWithStatus({
        message: GROUP_MESSAGES.CANNOT_REMOVE_OWNER,
        status: httpStatusCode.FORBIDDEN
      })
    }

    const currentMember = group.members.find((member) => member.userId.toString() === userId)
    if (currentMember?.role === GroupRole.Admin && memberToRemove.role === GroupRole.Admin) {
      throw new ErrorWithStatus({
        message: GROUP_MESSAGES.ADMIN_CANNOT_REMOVE_ADMIN,
        status: httpStatusCode.FORBIDDEN
      })
    }

    const result = await databaseService.groups.findOneAndUpdate(
      { _id: new ObjectId(groupId) },
      {
        $pull: { members: { userId: new ObjectId(memberId) } },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    )

    await databaseService.users.updateOne({ _id: new ObjectId(memberId) }, { $pull: { groups: new ObjectId(groupId) } })

    return result
  }

  async getGroupParticipants(userId: string, groupId: string) {
    const group = await databaseService.groups.findOne({
      _id: new ObjectId(groupId),
      isArchived: false
    })

    if (!group) {
      throw new ErrorWithStatus({
        message: GROUP_MESSAGES.GROUP_NOT_FOUND,
        status: httpStatusCode.NOT_FOUND
      })
    }

    const isMember = group.members.some((m) => m.userId.toString() === userId)
    if (!isMember) {
      throw new ErrorWithStatus({
        message: GROUP_MESSAGES.USER_NOT_IN_GROUP,
        status: httpStatusCode.FORBIDDEN
      })
    }

    const userIds = group.members.map((m) => m.userId.toString())

    const users = await databaseService.users.find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } }).toArray()

    const userMap = new Map(users.map((u) => [u._id.toString(), excludeSensitiveFieldsForAnotherUser(u)]))

    return group.members.map((m) => ({
      ...m,
      user: userMap.get(m.userId.toString()) || null
    }))
  }
}

const groupService = new GroupService()
export default groupService
