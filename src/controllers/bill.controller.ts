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

class BillController {
  async createBill(req: Request<ParamsDictionary, any, CreateBillReqBody>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await billService.createBill(userId, req.body)
    return res.status(httpStatusCode.CREATED).json({
      message: BILL_MESSAGES.BILL_CREATED_SUCCESSFULLY,
      result
    })
  }

  async getGroupBills(
    req: Request<ParamsDictionary & { groupId: string }, any, any, GetGroupBillsReqQuery>,
    res: Response
  ) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { groupId } = req.params
    const result = await billService.getGroupBills(userId, groupId, req.query)
    return res.json({
      message: BILL_MESSAGES.GET_BILLS_SUCCESSFULLY,
      result
    })
  }

  async getBillById(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { billId } = req.params
    const result = await billService.getBillById(userId, billId)
    return res.json({
      message: BILL_MESSAGES.GET_BILL_SUCCESSFULLY,
      result
    })
  }

  async updateBill(req: Request<ParamsDictionary & { billId: string }, any, UpdateBillReqBody>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { billId } = req.params
    const result = await billService.updateBill(userId, billId, req.body)
    return res.json({
      message: BILL_MESSAGES.BILL_UPDATED_SUCCESSFULLY,
      result
    })
  }

  async deleteBill(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { billId } = req.params
    const result = await billService.deleteBill(userId, billId)
    return res.json({
      message: BILL_MESSAGES.BILL_DELETED_SUCCESSFULLY,
      result
    })
  }

  async addPayment(req: Request<ParamsDictionary & { billId: string }, any, AddPaymentReqBody>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { billId } = req.params
    const result = await billService.addPayment(userId, billId, req.body)
    return res.json({
      message: BILL_MESSAGES.PAYMENT_ADDED_SUCCESSFULLY,
      result
    })
  }

  async getBillPayments(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { billId } = req.params
    const result = await billService.getBillPayments(userId, billId)
    return res.json({
      message: BILL_MESSAGES.GET_PAYMENTS_SUCCESSFULLY,
      result
    })
  }
}

const billController = new BillController()
export default billController
