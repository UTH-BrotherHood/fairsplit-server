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

export interface UpdateMeReqBody {
  username?: string
  avatarUrl?: string
  dateOfBirth?: string
}

export interface ChangePasswordReqBody {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export interface SearchUsersReqQuery {
  query?: string
  page?: number
  limit?: number
}

export interface UpdateUserPreferencesReqBody {
  language?: string
  theme?: string
  notifications?: {
    email?: boolean
    push?: boolean
    sms?: boolean
  }
  [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface UpdatePrivacySettingsReqBody {
  profile_visibility?: 'public' | 'friends' | 'private'
  friend_requests?: 'everyone' | 'friends_of_friends' | 'none'
  [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface BlockUserReqBody {
  reason?: string
}
