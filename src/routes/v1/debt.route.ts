import { Router } from 'express'
import { accessTokenValidation } from '~/middlewares/auth.middlewares'
import debtController from '~/controllers/debt.controller'
import { wrapRequestHandler } from '~/utils/wrapHandler'
import { groupIdValidation, debtIdValidation } from '~/middlewares/debt.middlewares'

const debtRoute = Router()

/**
 * @swagger
 * /api/v1/debts:
 *   post:
 *     summary: Create a new debt
 */
debtRoute.post('/', accessTokenValidation, wrapRequestHandler(debtController.createDebt))

/**
 * @swagger
 * /api/v1/debts/groups/{groupId}:
 *   get:
 *     summary: Get all debts in a group
 */
debtRoute.get(
  '/groups/:groupId',
  accessTokenValidation,
  groupIdValidation,
  wrapRequestHandler(debtController.getGroupDebts)
)

/**
 * @swagger
 * /api/v1/debts/my-debts:
 *   get:
 *     summary: Get all debts of current user
 */
debtRoute.get('/my-debts', accessTokenValidation, wrapRequestHandler(debtController.getMyDebts))

/**
 * @swagger
 * /api/v1/debts/{debtId}/settle:
 *   post:
 *     summary: Settle a debt
 */
debtRoute.post(
  '/:debtId/settle',
  accessTokenValidation,
  debtIdValidation,
  wrapRequestHandler(debtController.settleDebt)
)

/**
 * @swagger
 * /api/v1/debts/{debtId}/history:
 *   get:
 *     summary: Get debt history
 */
debtRoute.get(
  '/:debtId/history',
  accessTokenValidation,
  debtIdValidation,
  wrapRequestHandler(debtController.getDebtHistory)
)

export default debtRoute
