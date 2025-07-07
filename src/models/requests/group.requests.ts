import { PaginationQuery } from '../interfaces/pagination.interface'
import { GroupRole, IGroupMember } from '../schemas/group.schema'

export interface CreateGroupReqBody {
  name: string
  description?: string
  avatarUrl?: string
  members?: IGroupMember[]
  settings?: {
    allowMembersInvite?: boolean
    allowMembersAddList?: boolean
    defaultSplitMethod?: 'equal' | 'percentage'
    currency?: string
  }
}

export interface UpdateGroupReqBody {
  name?: string
  description?: string
  avatarUrl?: string
  settings?: {
    allowMembersInvite?: boolean
    allowMembersAddList?: boolean
    defaultSplitMethod?: 'equal' | 'percentage'
    currency?: string
  }
}

export interface AddMemberReqBody {
  members: { userId: string; role?: GroupRole; nickname?: string }[]
}

export interface UpdateMemberReqBody {
  role?: GroupRole
  nickname?: string
}

export interface GetMyGroupsQuery extends PaginationQuery {
  search?: string
}
