import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TokenPayload } from '~/models/requests/user.requests'
import { GetDebtsReqQuery, SettleDebtReqBody } from '~/models/requests/debt.requests'
import debtService from '~/services/debt.service'
import { DEBT_MESSAGES } from '~/constants/messages'
import { OK } from '~/core/succes.response'

class DebtController {
  async createDebt(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await debtService.createDebt(userId, req.body)
    new OK({
      message: DEBT_MESSAGES.DEBT_CREATED_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async getGroupDebts(req: Request<ParamsDictionary & { groupId: string }, any, any, GetDebtsReqQuery>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { groupId } = req.params
    const result = await debtService.getGroupDebts(userId, groupId, req.query)
    new OK({
      message: DEBT_MESSAGES.GET_DEBTS_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async getMyDebts(req: Request<ParamsDictionary, any, any, GetDebtsReqQuery>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await debtService.getMyDebts(userId, req.query)
    new OK({
      message: DEBT_MESSAGES.GET_DEBTS_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async settleDebt(req: Request<ParamsDictionary & { debtId: string }, any, SettleDebtReqBody>, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { debtId } = req.params
    const result = await debtService.settleDebt(userId, debtId, req.body)
    return res.json({
      message: DEBT_MESSAGES.SETTLE_DEBT_SUCCESSFULLY,
      result
    })
  }

  async getDebtHistory(req: Request, res: Response) {
    const { userId } = req.decodedAuthorization as TokenPayload
    const { debtId } = req.params
    const result = await debtService.getDebtHistory(userId, debtId)
    return res.json({
      message: DEBT_MESSAGES.GET_DEBT_HISTORY_SUCCESSFULLY,
      result
    })
  }
}

const debtController = new DebtController()
export default debtController
