import { Router } from 'express'
import { validate } from '~/utils/validation.utils'
import { checkSchema } from 'express-validator'
import { accessTokenValidation } from '~/middlewares/auth.middlewares'
import debtController from '~/controllers/debt.controller'
import { wrapRequestHandler } from '~/utils/wrapHandler'

const debtRoute = Router()

/**
 * @swagger
 * /api/v1/debts/groups/{groupId}:
 *   get:
 *     summary: Get all debts in a group
 */
debtRoute.get(
  '/groups/:groupId',
  accessTokenValidation,
  validate(
    checkSchema({
      groupId: {
        in: ['params'],
        isString: true,
        trim: true,
        notEmpty: true
      }
    })
  ),
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
  validate(
    checkSchema({
      debtId: {
        in: ['params'],
        isString: true,
        trim: true,
        notEmpty: true
      }
    })
  ),
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
  validate(
    checkSchema({
      debtId: {
        in: ['params'],
        isString: true,
        trim: true,
        notEmpty: true
      }
    })
  ),
  wrapRequestHandler(debtController.getDebtHistory)
)

export default debtRoute
