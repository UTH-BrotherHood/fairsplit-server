import { checkSchema, param } from 'express-validator'
import { validate } from '~/utils/validation.utils'
import { GroupRole } from '~/models/schemas/group.schema'
import { GROUP_MESSAGES } from '~/constants/messages'
import { NextFunction, Request, Response } from 'express'
import databaseService from '~/services/database.services'
import { ObjectId } from 'mongodb'

export const createGroupValidation = validate(
  checkSchema({
    name: {
      notEmpty: true,
      isString: true,
      trim: true,
      isLength: {
        options: { min: 1, max: 100 }
      }
    },
    description: {
      optional: true,
      isString: true,
      trim: true,
      isLength: {
        options: { max: 500 }
      }
    },
    avatarUrl: {
      optional: true,
      isURL: true
    },
    members: {
      optional: true,
      isArray: true
    },
    'members.*.userId': {
      optional: true,
      isMongoId: true
    },
    'members.*.role': {
      optional: true,
      isIn: {
        options: [Object.values(GroupRole)]
      }
    },
    'members.*.nickname': {
      optional: true,
      isString: true,
      trim: true,
      isLength: {
        options: { max: 50 }
      }
    },
    settings: {
      optional: true,
      isObject: true
    },
    'settings.allowMembersInvite': {
      optional: true,
      isBoolean: true
    },
    'settings.allowMembersAddList': {
      optional: true,
      isBoolean: true
    },
    'settings.defaultSplitMethod': {
      optional: true,
      isIn: {
        options: [['equal', 'percentage']]
      }
    },
    'settings.currency': {
      optional: true,
      isString: true,
      isLength: {
        options: { min: 3, max: 3 }
      }
    }
  })
)

export const groupIdValidation = validate(
  checkSchema(
    {
      groupId: {
        notEmpty: {
          errorMessage: 'groupId is required in URL params'
        },
        isMongoId: {
          errorMessage: 'groupId must be a valid MongoId in URL params'
        }
      }
    },
    ['params']
  )
)

export const updateGroupValidation = validate(
  checkSchema({
    name: {
      optional: true,
      isString: true,
      trim: true,
      isLength: {
        options: { min: 1, max: 100 }
      }
    },
    description: {
      optional: true,
      isString: true,
      trim: true,
      isLength: {
        options: { max: 500 }
      }
    },
    avatarUrl: {
      optional: true,
      isURL: true
    },
    settings: {
      optional: true,
      isObject: true
    },
    'settings.allowMembersInvite': {
      optional: true,
      isBoolean: true
    },
    'settings.allowMembersAddList': {
      optional: true,
      isBoolean: true
    },
    'settings.defaultSplitMethod': {
      optional: true,
      isIn: {
        options: [['equal', 'percentage']]
      }
    },
    'settings.currency': {
      optional: true,
      isString: true,
      isLength: {
        options: { min: 3, max: 3 }
      }
    }
  })
)

export const addMemberValidation = validate(
  checkSchema({
    userId: {
      notEmpty: true,
      isMongoId: true
    },
    role: {
      optional: true,
      isIn: {
        options: [Object.values(GroupRole)]
      }
    },
    nickname: {
      optional: true,
      isString: true,
      trim: true,
      isLength: {
        options: { max: 50 }
      }
    }
  })
)

export const updateMemberValidation = validate(
  checkSchema({
    role: {
      optional: true,
      isIn: {
        options: [Object.values(GroupRole)]
      }
    },
    nickname: {
      optional: true,
      isString: true,
      trim: true,
      isLength: {
        options: { max: 50 }
      }
    }
  })
)
