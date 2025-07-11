import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody, TokenPayload } from '~/models/requests/user.requests'
import { USER_MESSAGES } from '~/constants/messages'
import { OK } from '~/core/succes.response'
import authService from '~/services/auth.service'
import { httpStatusCode } from '~/core/httpStatusCode'
import { ErrorWithStatus } from '~/utils/error.utils'

class AuthController {
  async register(req: Request<ParamsDictionary, unknown, RegisterReqBody>, res: Response) {
    const result = await authService.register(req.body)
    return new OK({
      message: USER_MESSAGES.REGISTER_SUCCESSFULLY,
      data: {
        ...result,
        next_steps: result.emailSent
          ? {
              action: 'verify_email',
              message: 'Please check your email to verify your account'
            }
          : undefined
      }
    }).send(res)
  }

  login = async (req: Request, res: Response) => {
    const result = await authService.login(req.body)
    new OK({
      message: USER_MESSAGES.LOGIN_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  googleLogin = async (req: Request, res: Response) => {
    const { idToken } = req.body

    if (!idToken) {
      throw new ErrorWithStatus({
        message: 'Missing idToken',
        status: httpStatusCode.UNAUTHORIZED
      })
    }

    const result = await authService.googleLogin(idToken)

    new OK({
      message: USER_MESSAGES.LOGIN_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async logout(req: Request, res: Response) {
    const { refreshToken } = req.body
    const { userId } = req.decodedAuthorization as TokenPayload
    const result = await authService.logout({ userId, refreshToken })
    return new OK({
      message: USER_MESSAGES.LOGOUT_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body
    const { userId, verify } = req.decodedRefreshToken as TokenPayload
    const result = await authService.refreshToken({ userId, verify, refreshToken })
    return new OK({
      message: USER_MESSAGES.REFRESH_TOKEN_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async verifyEmail(req: Request, res: Response) {
    const { code } = req.body
    const { userId } = req.decodedAuthorization as TokenPayload

    const result = await authService.verifyEmail(userId, code)
    return new OK({
      message: USER_MESSAGES.EMAIL_VERIFIED_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async verifyPhone(req: Request, res: Response) {
    const { code } = req.body
    const { userId } = req.decodedAuthorization as TokenPayload

    const result = await authService.verifyPhone(userId, code)
    return new OK({
      message: USER_MESSAGES.PHONE_VERIFIED_SUCCESSFULLY,
      data: result
    }).send(res)
  }

  async resendVerificationEmail(req: Request, res: Response) {
    const { email } = req.body
    await authService.resendVerificationEmail(email)
    return new OK({
      message: USER_MESSAGES.VERIFICATION_EMAIL_SENT_SUCCESSFULLY
    }).send(res)
  }

  async resendVerificationSMS(req: Request, res: Response) {
    const { phone } = req.body
    await authService.resendVerificationSMS(phone)
    return new OK({
      message: USER_MESSAGES.VERIFICATION_SMS_SENT_SUCCESSFULLY
    }).send(res)
  }

  async forgotPassword(req: Request, res: Response) {
    const { email, phone } = req.body
    await authService.forgotPassword({ email, phone })
    return new OK({
      message: email
        ? USER_MESSAGES.VERIFICATION_EMAIL_SENT_SUCCESSFULLY
        : USER_MESSAGES.VERIFICATION_SMS_SENT_SUCCESSFULLY
    }).send(res)
  }

  async resetPassword(req: Request, res: Response) {
    const { code, password } = req.body
    await authService.resetPassword(code, password)
    return new OK({
      message: USER_MESSAGES.PASSWORD_RESET_SUCCESSFULLY
    }).send(res)
  }
}

const authController = new AuthController()
export default authController
