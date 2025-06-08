import { TokenType } from '../schemas/token.schema'
import { UserVerificationStatus, UserVerificationType } from '../schemas/user.schema'
import { JwtPayload } from 'jsonwebtoken'

export interface RegisterReqBody {
  username: string
  email?: string
  phone?: string
  password: string
  confirmPassword: string
  verificationType: UserVerificationType
  dateOfBirth: string
  avatarUrl?: string
}

export interface LoginReqBody {
  email?: string
  phone?: string
  password: string
}

export interface TokenPayload extends JwtPayload {
  userId: string
  verify: UserVerificationStatus
  role: string
  tokenType: TokenType
  exp?: number
  iat?: number
}

export interface ForgotPasswordReqBody {
  email?: string
  phone?: string
}

export interface ResetPasswordReqBody {
  code: string
  password: string
  confirm_password: string
}

export interface VerifyEmailReqBody {
  code: string
}

export interface VerifyPhoneReqBody {
  code: string
}

export interface ResendVerificationEmailReqBody {
  email: string
}

export interface ResendVerificationSMSReqBody {
  phone: string
}
