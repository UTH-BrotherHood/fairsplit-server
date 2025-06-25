import { GroupRole, IGroupMember } from '../schemas/group.schema'

export interface CreateGroupReqBody {
  name: string
  description?: string
  avatarUrl?: string
  members?: Array<{
    userId: string
    role?: GroupRole
    nickname?: string
  }>
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
  userId: string
  role?: GroupRole
  nickname?: string
}

export interface UpdateMemberReqBody {
  memberId: string
  role?: GroupRole
  nickname?: string
}
