import { Router } from 'express'
import { accessTokenValidation } from '~/middlewares/auth.middlewares'
import { wrapRequestHandler } from '~/utils/wrapHandler'
import groupController from '~/controllers/group.controller'
import {
  createGroupValidation,
  groupIdValidation,
  updateGroupValidation,
  addMemberValidation,
  updateMemberValidation
} from '~/middlewares/group.middlewares'
import { uploadMiddleware } from '~/middlewares/upload.middlware'
import { uploadSingle } from '~/config/upload/multer'

const groupRoute = Router()

/**
 * Group Management Routes
 */
groupRoute.post(
  '/',
  accessTokenValidation,
  uploadSingle('avatar'),
  uploadMiddleware,
  createGroupValidation,
  wrapRequestHandler(groupController.createGroup)
)

groupRoute.get('/my-groups', accessTokenValidation, wrapRequestHandler(groupController.getMyGroups))

groupRoute.get('/:groupId', accessTokenValidation, groupIdValidation, wrapRequestHandler(groupController.getGroupById))

groupRoute.patch(
  '/:groupId',
  accessTokenValidation,
  uploadSingle('avatar'),
  uploadMiddleware,
  updateGroupValidation,
  wrapRequestHandler(groupController.updateGroup)
)

groupRoute.delete('/:groupId', accessTokenValidation, wrapRequestHandler(groupController.deleteGroup))

/**
 * Group Member Management Routes
 */
groupRoute.get(
  '/:groupId/members',
  accessTokenValidation,
  groupIdValidation,
  wrapRequestHandler(groupController.getGroupParticipants)
)

groupRoute.post(
  '/:groupId/members',
  accessTokenValidation,
  addMemberValidation,
  wrapRequestHandler(groupController.addMember)
)

groupRoute.patch(
  '/:groupId/members/:memberId',
  accessTokenValidation,
  updateMemberValidation,
  wrapRequestHandler(groupController.updateMember)
)

groupRoute.delete(
  '/:groupId/members/:memberId',
  accessTokenValidation,
  wrapRequestHandler(groupController.removeMember)
)

export default groupRoute
