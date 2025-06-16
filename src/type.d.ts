import { IUser } from './models/schemas/user.schema'
import { TokenPayload } from './models/requests/user.requests'

declare global {
  namespace Express {
    interface Request {
      decodedRefreshToken?: TokenPayload
      decodedAuthorization?: TokenPayload
      decodedForgotPasswordToken?: TokenPayload
      user?: IUser
      fileUrl?: string
      fileUrls?: string[]
    }
  }
}
