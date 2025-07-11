import { checkSchema } from 'express-validator'
import { validate } from '~/utils/validation.utils'
import { GroupRole } from '~/models/schemas/group.schema'
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
      isString: {
        errorMessage: 'Avatar URL must be a string'
      },
      isLength: {
        options: {
          min: 0,
          max: 2000
        },
        errorMessage: 'Avatar URL length must be between 0 and 2000 characters'
      },
      trim: true,
      matches: {
        options: /^https?:\/\//,
        errorMessage: 'Avatar URL must be a valid HTTP/HTTPS URL'
      }
    },
    members: {
      optional: true,
      isArray: {
        errorMessage: 'members must be an array of objects'
      },
      custom: {
        options: (members) => {
          if (!Array.isArray(members)) return true
          for (const member of members) {
            if (typeof member !== 'object' || member === null) {
              throw new Error('Each member must be an object')
            }
            if (!member.userId) {
              throw new Error('Each member must have a userId')
            }
            if (!ObjectId.isValid(member.userId)) {
              throw new Error('Each member.userId must be a valid MongoId')
            }
            if (member.role && !Object.values(GroupRole).includes(member.role)) {
              throw new Error('Each member.role must be a valid GroupRole')
            }
            if (member.nickname && (typeof member.nickname !== 'string' || member.nickname.length > 50)) {
              throw new Error('Each member.nickname must be a string with max 50 characters')
            }
          }
          return true
        }
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
    members: {
      in: ['body'],
      isArray: {
        errorMessage: 'members must be an array'
      },
      custom: {
        options: (members) => {
          if (!Array.isArray(members) || members.length === 0) {
            throw new Error('members must be a non-empty array')
          }

          for (const member of members) {
            if (typeof member.userId !== 'string' || !/^[a-f\d]{24}$/i.test(member.userId)) {
              throw new Error('Each member.userId must be a valid MongoId')
            }
            if (member.role && !Object.values(GroupRole).includes(member.role)) {
              throw new Error(`Invalid role: ${member.role}`)
            }
            if (member.nickname && (typeof member.nickname !== 'string' || member.nickname.length > 50)) {
              throw new Error('Nickname must be a string under 50 characters')
            }
          }

          return true
        }
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
