import { IUser } from './models/schemas/user.schema'
import { TokenPayload } from './types/auth.types'

declare global {
  namespace Express {
    interface Request {
      decodedRefreshToken?: TokenPayload
      decodedAuthorization?: TokenPayload
      user?: IUser
      fileUrl?: string
      fileUrls?: string[]
    }
  }
}
