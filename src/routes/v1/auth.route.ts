import { Router } from 'express'
import passport from 'passport'
import authController from '~/controllers/auth.controller'
import {
  accessTokenValidation,
  loginValidation,
  registerValidation,
  refreshTokenValidation,
  verifyEmailValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} from '~/middlewares/auth.middlewares'
import { wrapRequestHandler } from '~/utils/wrapHandler'
import { uploadSingle } from '~/config/upload/multer'
import { uploadMiddleware } from '~/middlewares/upload.middlware'

const authRoute = Router()

authRoute.post(
  '/register',
  uploadSingle('avatar'),
  uploadMiddleware,
  registerValidation,
  wrapRequestHandler(authController.register)
)

authRoute.post('/login', loginValidation, wrapRequestHandler(authController.login))

authRoute.post('/logout', accessTokenValidation, refreshTokenValidation, wrapRequestHandler(authController.logout))

authRoute.post('/refresh-token', refreshTokenValidation, wrapRequestHandler(authController.refreshToken))

authRoute.post(
  '/verify-email',
  accessTokenValidation,
  verifyEmailValidation,
  wrapRequestHandler(authController.verifyEmail)
)

authRoute.post(
  '/verify-phone',
  accessTokenValidation,
  verifyEmailValidation,
  wrapRequestHandler(authController.verifyPhone)
)

authRoute.post('/resend-verification-email', wrapRequestHandler(authController.resendVerificationEmail))

authRoute.post('/resend-verification-sms', wrapRequestHandler(authController.resendVerificationSMS))

authRoute.post('/forgot-password', forgotPasswordValidation, wrapRequestHandler(authController.forgotPassword))

authRoute.post('/reset-password', resetPasswordValidation, wrapRequestHandler(authController.resetPassword))

authRoute.get('/login/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }))

authRoute.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  wrapRequestHandler(authController.googleLogin)
)

export default authRoute
