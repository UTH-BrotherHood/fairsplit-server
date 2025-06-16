import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/env'

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

export const GroupModel = {
  collectionName: envConfig.dbGroupCollection,
  jsonSchema: {
    bsonType: 'object',
    required: ['name', 'members', 'createdAt', 'updatedAt', 'isArchived', 'settings'],
    properties: {
      _id: { bsonType: 'objectId' },
      name: {
        bsonType: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Group name'
      },
      description: {
        bsonType: 'string',
        maxLength: 500,
        description: 'Group description'
      },
      avatarUrl: {
        bsonType: 'string',
        pattern: '^https?://',
        description: 'Group avatar URL'
      },
      members: {
        bsonType: 'array',
        minItems: 1,
        items: {
          bsonType: 'object',
          required: ['userId', 'role', 'joinedAt'],
          properties: {
            userId: { bsonType: 'objectId' },
            role: { enum: Object.values(GroupRole) },
            joinedAt: { bsonType: 'date' },
            nickname: { bsonType: 'string', maxLength: 50 }
          }
        }
      },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' },
      isArchived: { bsonType: 'bool' },
      settings: {
        bsonType: 'object',
        required: ['allowMembersInvite', 'allowMembersAddList', 'defaultSplitMethod', 'currency'],
        properties: {
          allowMembersInvite: { bsonType: 'bool' },
          allowMembersAddList: { bsonType: 'bool' },
          defaultSplitMethod: { enum: ['equal', 'percentage'] },
          currency: { bsonType: 'string', minLength: 3, maxLength: 3 }
        }
      }
    }
  },
  indexes: [{ key: { 'members.userId': 1 } }, { key: { isArchived: 1 } }]
}
