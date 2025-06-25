import { ObjectId } from 'mongodb'

export enum GroupRole {
  Owner = 'owner',
  Admin = 'admin',
  Member = 'member'
}

export interface IGroupMember {
  userId: ObjectId
  role: GroupRole
  joinedAt: Date
  nickname?: string
}

export interface IGroup {
  _id?: ObjectId
  name: string
  description?: string
  avatarUrl?: string
  members: IGroupMember[]
  createdAt: Date
  updatedAt: Date
  isArchived: boolean
  settings: {
    allowMembersInvite: boolean
    allowMembersAddList: boolean
    defaultSplitMethod: 'equal' | 'percentage'
    currency: string
  }
}
