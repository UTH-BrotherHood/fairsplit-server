import { Router } from 'express'
import billController from '~/controllers/bill.controller'
import { accessTokenValidation } from '~/middlewares/auth.middlewares'
import { wrapRequestHandler } from '~/utils/wrapHandler'
import {
  createBillValidation,
  groupBillsValidation,
  billIdValidation,
  updateBillValidation,
  addPaymentValidation
} from '~/middlewares/bill.middlewares'

const billRoute = Router()

/**
 * Bill Management Routes
 */
billRoute.post('/', accessTokenValidation, createBillValidation, wrapRequestHandler(billController.createBill))

billRoute.get(
  '/group/:groupId',
  accessTokenValidation,
  groupBillsValidation,
  wrapRequestHandler(billController.getGroupBills)
)

billRoute.get('/:billId', accessTokenValidation, billIdValidation, wrapRequestHandler(billController.getBillById))

billRoute.patch('/:billId', accessTokenValidation, updateBillValidation, wrapRequestHandler(billController.updateBill))

billRoute.delete('/:billId', accessTokenValidation, billIdValidation, wrapRequestHandler(billController.deleteBill))

/**
 * Bill Payment Routes
 */
billRoute.post(
  '/:billId/payments',
  accessTokenValidation,
  addPaymentValidation,
  wrapRequestHandler(billController.addPayment)
)

billRoute.get(
  '/:billId/payments',
  accessTokenValidation,
  billIdValidation,
  wrapRequestHandler(billController.getBillPayments)
)

billRoute.get(
  '/:billId/payments/:paymentId',
  accessTokenValidation,
  billIdValidation,
  wrapRequestHandler(billController.getPaymentById)
)

billRoute.patch(
  '/:billId/payments/:paymentId',
  accessTokenValidation,
  billIdValidation,
  wrapRequestHandler(billController.updatePayment)
)

billRoute.delete(
  '/:billId/payments/:paymentId',
  accessTokenValidation,
  billIdValidation,
  wrapRequestHandler(billController.deletePayment)
)
export default billRoute
