import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TokenPayload } from '~/models/requests/user.requests'
import { GetDebtsReqQuery, SettleDebtReqBody } from '~/models/requests/debt.requests'
import debtService from '~/services/debt.service'
import { DEBT_MESSAGES } from '~/constants/messages'
import { httpStatusCode } from '~/core/httpStatusCode'

export const getGroupDebtsController = async (
  req: Request<ParamsDictionary & { groupId: string }, any, any, GetDebtsReqQuery>,
  res: Response
) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const { groupId } = req.params
  const result = await debtService.getGroupDebts(user_id, groupId, req.query)
  return res.json({
    message: DEBT_MESSAGES.GET_DEBTS_SUCCESSFULLY,
    result
  })
}

export const getMyDebtsController = async (
  req: Request<ParamsDictionary, any, any, GetDebtsReqQuery>,
  res: Response
) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const result = await debtService.getMyDebts(user_id, req.query)
  return res.json({
    message: DEBT_MESSAGES.GET_DEBTS_SUCCESSFULLY,
    result
  })
}

export const settleDebtController = async (
  req: Request<ParamsDictionary & { debtId: string }, any, SettleDebtReqBody>,
  res: Response
) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const { debtId } = req.params
  const result = await debtService.settleDebt(user_id, debtId, req.body)
  return res.json({
    message: DEBT_MESSAGES.SETTLE_DEBT_SUCCESSFULLY,
    result
  })
}

export const getDebtHistoryController = async (req: Request, res: Response) => {
  const { user_id } = req.decodedAuthorization as TokenPayload
  const { debtId } = req.params
  const result = await debtService.getDebtHistory(user_id, debtId)
  return res.json({
    message: DEBT_MESSAGES.GET_DEBT_HISTORY_SUCCESSFULLY,
    result
  })
}

const debtController = {
  getGroupDebts: getGroupDebtsController,
  getMyDebts: getMyDebtsController,
  settleDebt: settleDebtController,
  getDebtHistory: getDebtHistoryController
}

export default debtController
