import { Router } from 'express'
import { validate } from '~/utils/validation.utils'
import { checkSchema } from 'express-validator'
import { accessTokenValidation } from '~/middlewares/auth.middlewares'
import { wrapRequestHandler } from '~/utils/handler.utils'
import debtController from '~/controllers/debt.controller'

const debtRoute = Router()

/**
 * Debt Management Routes
 */
debtRoute.get(
  '/group/:groupId',
  accessTokenValidation,
  validate(
    checkSchema({
      groupId: {
        notEmpty: true,
        isMongoId: true
      }
    })
  ),
  wrapRequestHandler(debtController.getGroupDebts)
)

debtRoute.get(
  '/my-debts',
  accessTokenValidation,
  validate(
    checkSchema({
      status: {
        optional: true,
        isIn: {
          options: [['pending', 'partially_paid', 'completed']]
        }
      },
      groupId: {
        optional: true,
        isMongoId: true
      }
    })
  ),
  wrapRequestHandler(debtController.getMyDebts)
)

debtRoute.get(
  '/summary',
  accessTokenValidation,
  validate(
    checkSchema({
      groupId: {
        optional: true,
        isMongoId: true
      }
    })
  ),
  wrapRequestHandler(debtController.getDebtSummary)
)

/**
 * Debt Settlement Routes
 */
debtRoute.post(
  '/settle',
  accessTokenValidation,
  validate(
    checkSchema({
      groupId: {
        notEmpty: true,
        isMongoId: true
      },
      debtorId: {
        notEmpty: true,
        isMongoId: true
      },
      creditorId: {
        notEmpty: true,
        isMongoId: true
      },
      amount: {
        notEmpty: true,
        isFloat: {
          options: { min: 0 }
        }
      },
      currency: {
        notEmpty: true,
        isString: true,
        isLength: {
          options: { min: 3, max: 3 }
        }
      },
      date: {
        notEmpty: true,
        isISO8601: true
      },
      method: {
        notEmpty: true,
        isIn: {
          options: [['cash', 'bank_transfer', 'other']]
        }
      },
      notes: {
        optional: true,
        isString: true,
        trim: true,
        isLength: {
          options: { max: 500 }
        }
      }
    })
  ),
  wrapRequestHandler(debtController.settleDebt)
)

debtRoute.get(
  '/settlements',
  accessTokenValidation,
  validate(
    checkSchema({
      groupId: {
        optional: true,
        isMongoId: true
      },
      startDate: {
        optional: true,
        isISO8601: true
      },
      endDate: {
        optional: true,
        isISO8601: true
      },
      page: {
        optional: true,
        isInt: {
          options: { min: 1 }
        }
      },
      limit: {
        optional: true,
        isInt: {
          options: { min: 1, max: 100 }
        }
      }
    })
  ),
  wrapRequestHandler(debtController.getSettlements)
)

debtRoute.get(
  '/settlements/:settlementId',
  accessTokenValidation,
  validate(
    checkSchema({
      settlementId: {
        notEmpty: true,
        isMongoId: true
      }
    })
  ),
  wrapRequestHandler(debtController.getSettlementById)
)

export default debtRoute
