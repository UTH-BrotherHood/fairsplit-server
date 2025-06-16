import { Router } from 'express'
import { validate } from '~/utils/validation.utils'
import { checkSchema } from 'express-validator'
import { accessTokenValidation } from '~/middlewares/auth.middlewares'
import { wrapRequestHandler } from '~/utils/wrapHandler'
import groupController from '~/controllers/group.controller'
import { GroupRole } from '~/models/schemas/group.schema'

const groupRoute = Router()

/**
 * Group Management Routes
 */
groupRoute.post(
  '/',
  accessTokenValidation,
  validate(
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
  ),
  wrapRequestHandler(groupController.createGroup)
)

groupRoute.get('/my-groups', accessTokenValidation, wrapRequestHandler(groupController.getMyGroups))

groupRoute.get(
  '/:groupId',
  accessTokenValidation,
  validate(
    checkSchema({
      groupId: {
        notEmpty: true,
        isMongoId: true
      }
    })
  ),
  wrapRequestHandler(groupController.getGroupById)
)

groupRoute.patch(
  '/:groupId',
  accessTokenValidation,
  validate(
    checkSchema({
      groupId: {
        notEmpty: true,
        isMongoId: true
      },
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
  ),
  wrapRequestHandler(groupController.updateGroup)
)

groupRoute.delete(
  '/:groupId',
  accessTokenValidation,
  validate(
    checkSchema({
      groupId: {
        notEmpty: true,
        isMongoId: true
      }
    })
  ),
  wrapRequestHandler(groupController.deleteGroup)
)

/**
 * Group Member Management Routes
 */
groupRoute.post(
  '/:groupId/members',
  accessTokenValidation,
  validate(
    checkSchema({
      groupId: {
        notEmpty: true,
        isMongoId: true
      },
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
  ),
  wrapRequestHandler(groupController.addMember)
)

groupRoute.patch(
  '/:groupId/members/:userId',
  accessTokenValidation,
  validate(
    checkSchema({
      groupId: {
        notEmpty: true,
        isMongoId: true
      },
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
  ),
  wrapRequestHandler(groupController.updateMember)
)

groupRoute.delete(
  '/:groupId/members/:userId',
  accessTokenValidation,
  validate(
    checkSchema({
      groupId: {
        notEmpty: true,
        isMongoId: true
      },
      userId: {
        notEmpty: true,
        isMongoId: true
      }
    })
  ),
  wrapRequestHandler(groupController.removeMember)
)

export default groupRoute
