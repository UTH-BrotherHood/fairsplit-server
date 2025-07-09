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
import { CREATED, OK } from '~/core/succes.response'

class BillController {
  async createBill(req: Request<ParamsDictionary, any, CreateBillReqBody>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await billService.createBill(userId, req.body)
    new CREATED({
      message: BILL_MESSAGES.BILL_CREATED_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async getGroupBills(
    req: Request<ParamsDictionary & { groupId: string }, any, any, GetGroupBillsReqQuery>,
    res: Response
  ) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { groupId } = req.params
    const result = await billService.getGroupBills(userId, groupId, req.query)
    new OK({
      message: BILL_MESSAGES.GET_BILLS_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async getBillById(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { billId } = req.params
    const result = await billService.getBillById(userId, billId)
    new OK({
      message: BILL_MESSAGES.GET_BILL_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async updateBill(req: Request<ParamsDictionary & { billId: string }, any, UpdateBillReqBody>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { billId } = req.params
    const result = await billService.updateBill(userId, billId, req.body)
    new OK({
      message: BILL_MESSAGES.BILL_UPDATED_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async deleteBill(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { billId } = req.params
    const result = await billService.deleteBill(userId, billId)
    new OK({
      message: BILL_MESSAGES.BILL_DELETED_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async addPayment(req: Request<ParamsDictionary & { billId: string }, any, AddPaymentReqBody>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { billId } = req.params
    const result = await billService.addPayment(userId, billId, req.body)
    new CREATED({
      message: BILL_MESSAGES.PAYMENT_ADDED_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async getBillPayments(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { billId } = req.params
    const result = await billService.getBillPayments(userId, billId)
    new OK({
      message: BILL_MESSAGES.GET_PAYMENTS_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async getPaymentById(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { billId, paymentId } = req.params
    const bill = await billService.getBillById(userId, billId)
    const payment = bill.payments.find((p) => p._id.toString() === paymentId)
    if (!payment) {
      return res.status(404).json({ message: BILL_MESSAGES.PAYMENT_NOT_FOUND })
    }

    new OK({
      message: BILL_MESSAGES.GET_PAYMENT_SUCCESSFULLY,
      data: payment
    }).send(res)
  }

  async updatePayment(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { billId, paymentId } = req.params
    const updateData = req.body
    const updatedPayment = await billService.updatePayment(userId, billId, paymentId, updateData)

    new OK({
      message: BILL_MESSAGES.PAYMENT_UPDATED_SUCCESSFULLY,
      data: updatedPayment
    }).send(res)
  }

  async deletePayment(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { billId, paymentId } = req.params
    await billService.deletePayment(userId, billId, paymentId)

    new OK({
      message: BILL_MESSAGES.PAYMENT_DELETED_SUCCESSFULLY
    }).send(res)
  }
}

const billController = new BillController()
export default billController
