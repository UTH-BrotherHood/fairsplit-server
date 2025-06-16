import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TokenPayload } from '~/models/requests/user.requests'
import {
  CreateBillReqBody,
  UpdateBillReqBody,
  GetGroupBillsReqQuery,
  AddPaymentReqBody
} from '~/models/requests/bill.requests'
import billService from '~/services/bill.service'
import { BILL_MESSAGES } from '~/constants/messages'
import { httpStatusCode } from '~/core/httpStatusCode'

export const createBillController = async (req: Request<ParamsDictionary, any, CreateBillReqBody>, res: Response) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const result = await billService.createBill(user_id, req.body)
  return res.status(httpStatusCode.CREATED).json({
    message: BILL_MESSAGES.CREATE_BILL_SUCCESSFULLY,
    result
  })
}

export const getGroupBillsController = async (
  req: Request<ParamsDictionary & { groupId: string }, any, any, GetGroupBillsReqQuery>,
  res: Response
) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const { groupId } = req.params
  const result = await billService.getGroupBills(user_id, groupId, req.query)
  return res.json({
    message: BILL_MESSAGES.GET_BILLS_SUCCESSFULLY,
    result
  })
}

export const getBillByIdController = async (req: Request, res: Response) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const { billId } = req.params
  const result = await billService.getBillById(user_id, billId)
  return res.json({
    message: BILL_MESSAGES.GET_BILL_SUCCESSFULLY,
    result
  })
}

export const updateBillController = async (
  req: Request<ParamsDictionary & { billId: string }, any, UpdateBillReqBody>,
  res: Response
) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const { billId } = req.params
  const result = await billService.updateBill(user_id, billId, req.body)
  return res.json({
    message: BILL_MESSAGES.UPDATE_BILL_SUCCESSFULLY,
    result
  })
}

export const deleteBillController = async (req: Request, res: Response) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const { billId } = req.params
  const result = await billService.deleteBill(user_id, billId)
  return res.json({
    message: BILL_MESSAGES.DELETE_BILL_SUCCESSFULLY,
    result
  })
}

export const addPaymentController = async (
  req: Request<ParamsDictionary & { billId: string }, any, AddPaymentReqBody>,
  res: Response
) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const { billId } = req.params
  const result = await billService.addPayment(user_id, billId, req.body)
  return res.json({
    message: BILL_MESSAGES.ADD_PAYMENT_SUCCESSFULLY,
    result
  })
}

export const getBillPaymentsController = async (req: Request, res: Response) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const { billId } = req.params
  const result = await billService.getBillPayments(user_id, billId)
  return res.json({
    message: BILL_MESSAGES.GET_PAYMENTS_SUCCESSFULLY,
    result
  })
}

const billController = {
  createBill: createBillController,
  getGroupBills: getGroupBillsController,
  getBillById: getBillByIdController,
  updateBill: updateBillController,
  deleteBill: deleteBillController,
  addPayment: addPaymentController,
  getBillPayments: getBillPaymentsController
}

export default billController
