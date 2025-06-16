import { Router } from 'express'
import { checkSchema } from 'express-validator'
import billController from '~/controllers/bill.controller'
import { accessTokenValidation } from '~/middlewares/auth.middlewares'
import { validate } from '~/utils/validation.utils'
import { wrapRequestHandler } from '~/utils/wrapHandler'

const billRoute = Router()

/**
 * Bill Management Routes
 */
billRoute.post(
  '/',
  accessTokenValidation,
  validate(
    checkSchema({
      groupId: {
        notEmpty: true,
        isMongoId: true
      },
      title: {
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
      category: {
        optional: true,
        isString: true
      },
      splitMethod: {
        notEmpty: true,
        isIn: {
          options: [['equal', 'percentage']]
        }
      },
      paidBy: {
        notEmpty: true,
        isMongoId: true
      },
      participants: {
        isArray: true,
        custom: {
          options: (value) => value && value.length > 0
        }
      },
      'participants.*.userId': {
        notEmpty: true,
        isMongoId: true
      },
      'participants.*.share': {
        notEmpty: true,
        isFloat: {
          options: { min: 0 }
        }
      }
    })
  ),
  wrapRequestHandler(billController.createBill)
)

billRoute.get(
  '/group/:groupId',
  accessTokenValidation,
  validate(
    checkSchema({
      groupId: {
        notEmpty: true,
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
      category: {
        optional: true,
        isString: true
      },
      status: {
        optional: true,
        isIn: {
          options: [['pending', 'partially_paid', 'completed', 'cancelled']]
        }
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
  wrapRequestHandler(billController.getGroupBills)
)

billRoute.get(
  '/:billId',
  accessTokenValidation,
  validate(
    checkSchema({
      billId: {
        notEmpty: true,
        isMongoId: true
      }
    })
  ),
  wrapRequestHandler(billController.getBillById)
)

billRoute.patch(
  '/:billId',
  accessTokenValidation,
  validate(
    checkSchema({
      billId: {
        notEmpty: true,
        isMongoId: true
      },
      title: {
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
      amount: {
        optional: true,
        isFloat: {
          options: { min: 0 }
        }
      },
      date: {
        optional: true,
        isISO8601: true
      },
      category: {
        optional: true,
        isString: true
      },
      splitMethod: {
        optional: true,
        isIn: {
          options: [['equal', 'percentage']]
        }
      },
      participants: {
        optional: true,
        isArray: true,
        custom: {
          options: (value) => !value || value.length > 0
        }
      },
      'participants.*.userId': {
        optional: true,
        isMongoId: true
      },
      'participants.*.share': {
        optional: true,
        isFloat: {
          options: { min: 0 }
        }
      }
    })
  ),
  wrapRequestHandler(billController.updateBill)
)

billRoute.delete(
  '/:billId',
  accessTokenValidation,
  validate(
    checkSchema({
      billId: {
        notEmpty: true,
        isMongoId: true
      }
    })
  ),
  wrapRequestHandler(billController.deleteBill)
)

/**
 * Bill Payment Routes
 */
billRoute.post(
  '/:billId/payments',
  accessTokenValidation,
  validate(
    checkSchema({
      billId: {
        notEmpty: true,
        isMongoId: true
      },
      amount: {
        notEmpty: true,
        isFloat: {
          options: { min: 0 }
        }
      },
      paidBy: {
        notEmpty: true,
        isMongoId: true
      },
      paidTo: {
        notEmpty: true,
        isMongoId: true
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
  wrapRequestHandler(billController.addPayment)
)

billRoute.get(
  '/:billId/payments',
  accessTokenValidation,
  validate(
    checkSchema({
      billId: {
        notEmpty: true,
        isMongoId: true
      }
    })
  ),
  wrapRequestHandler(billController.getBillPayments)
)

export default billRoute
