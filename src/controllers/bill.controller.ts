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
  private billService: typeof billService

  constructor() {
    this.billService = billService
  }

  async createBill(req: Request<ParamsDictionary, any, CreateBillReqBody>, res: Response) {
    const { user_id } = req.decodedAuthorization as TokenPayload
    const result = await this.billService.createBill(user_id, req.body)
    return res.status(httpStatusCode.CREATED).json({
      message: BILL_MESSAGES.BILL_CREATED_SUCCESSFULLY,
      result
    })
  }

  async getGroupBills(
    req: Request<ParamsDictionary & { groupId: string }, any, any, GetGroupBillsReqQuery>,
    res: Response
  ) {
    const { user_id } = req.decodedAuthorization as TokenPayload
    const { groupId } = req.params
    const result = await this.billService.getGroupBills(user_id, groupId, req.query)
    return res.json({
      message: BILL_MESSAGES.GET_BILLS_SUCCESSFULLY,
      result
    })
  }

  async getBillById(req: Request, res: Response) {
    const { user_id } = req.decodedAuthorization as TokenPayload
    const { billId } = req.params
    const result = await this.billService.getBillById(user_id, billId)
    return res.json({
      message: BILL_MESSAGES.GET_BILL_SUCCESSFULLY,
      result
    })
  }

  async updateBill(req: Request<ParamsDictionary & { billId: string }, any, UpdateBillReqBody>, res: Response) {
    const { user_id } = req.decodedAuthorization as TokenPayload
    const { billId } = req.params
    const result = await this.billService.updateBill(user_id, billId, req.body)
    return res.json({
      message: BILL_MESSAGES.BILL_UPDATED_SUCCESSFULLY,
      result
    })
  }

  async deleteBill(req: Request, res: Response) {
    const { user_id } = req.decodedAuthorization as TokenPayload
    const { billId } = req.params
    const result = await this.billService.deleteBill(user_id, billId)
    return res.json({
      message: BILL_MESSAGES.BILL_DELETED_SUCCESSFULLY,
      result
    })
  }

  async addPayment(req: Request<ParamsDictionary & { billId: string }, any, AddPaymentReqBody>, res: Response) {
    const { user_id } = req.decodedAuthorization as TokenPayload
    const { billId } = req.params
    const result = await this.billService.addPayment(user_id, billId, req.body)
    return res.json({
      message: BILL_MESSAGES.PAYMENT_ADDED_SUCCESSFULLY,
      result
    })
  }

  async getBillPayments(req: Request, res: Response) {
    const { user_id } = req.decodedAuthorization as TokenPayload
    const { billId } = req.params
    const result = await this.billService.getBillPayments(user_id, billId)
    return res.json({
      message: BILL_MESSAGES.GET_PAYMENTS_SUCCESSFULLY,
      result
    })
  }
}

const billController = new BillController()
export default billController
