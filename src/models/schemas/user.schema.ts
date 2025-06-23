import { ObjectId } from 'mongodb'
import { z } from 'zod'

export enum UserVerificationStatus {
  Unverified = 'unverified',
  Verified = 'verified'
}

export enum UserVerificationType {
  Email = 'email',
  Phone = 'phone'
}

export interface IUser {
  _id?: ObjectId
  username: string
  email?: string
  phone?: string
  hashPassword?: string
  groups?: ObjectId[]
  avatarUrl?: string
  dateOfBirth: Date
  verify: UserVerificationStatus
  verificationType: UserVerificationType
  friends?: ObjectId[]
  blockedUsers?: Array<{
    userId: ObjectId
    reason?: string
    createdAt: Date
  }>
  preferences?: {
    language?: string
    theme?: string
    notifications?: {
      email?: boolean
      push?: boolean
      sms?: boolean
    }
    [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  privacySettings?: {
    profileVisibility?: 'public' | 'friends' | 'private'
    friendRequests?: 'everyone' | 'friendsOfFriends' | 'none'
    [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  google?: {
    googleId: string
  }
  facebook?: {
    facebookId: string
  }
  twitter?: {
    twitterId: string
  }
  createdAt: Date
  updatedAt: Date
}

export class User implements IUser {
  _id?: ObjectId
  username: string
  email?: string
  phone?: string
  hashPassword?: string
  groups?: ObjectId[]
  dateOfBirth: Date
  avatarUrl?: string
  verify: UserVerificationStatus
  verificationType: UserVerificationType
  friends?: ObjectId[]
  blockedUsers?: Array<{
    userId: ObjectId
    reason?: string
    createdAt: Date
  }>
  preferences?: {
    language?: string
    theme?: string
    notifications?: {
      email?: boolean
      push?: boolean
      sms?: boolean
    }
    [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  privacySettings?: {
    profileVisibility?: 'public' | 'friends' | 'private'
    friendRequests?: 'everyone' | 'friendsOfFriends' | 'none'
    [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  google?: {
    googleId: string
  }
  facebook?: {
    facebookId: string
  }
  twitter?: {
    twitterId: string
  }
  createdAt: Date
  updatedAt: Date

  constructor({
    username,
    email,
    phone,
    groups,
    hashPassword,
    dateOfBirth,
    avatarUrl,
    verify = UserVerificationStatus.Unverified,
    verificationType,
    friends = [],
    blockedUsers = [],
    preferences = {},
    privacySettings = {
      profileVisibility: 'public',
      friendRequests: 'everyone'
    },
    google,
    facebook,
    twitter,
    createdAt = new Date(),
    updatedAt = new Date()
  }: {
    username: string
    email?: string
    phone?: string
    hashPassword?: string
    groups: ObjectId[]
    dateOfBirth: Date
    avatarUrl?: string
    verify?: UserVerificationStatus
    verificationType: UserVerificationType
    friends?: ObjectId[]
    blockedUsers?: Array<{
      userId: ObjectId
      reason?: string
      createdAt: Date
    }>
    preferences?: {
      language?: string
      theme?: string
      notifications?: {
        email?: boolean
        push?: boolean
        sms?: boolean
      }
      [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    privacySettings?: {
      profileVisibility?: 'public' | 'friends' | 'private'
      friendRequests?: 'everyone' | 'friendsOfFriends' | 'none'
      [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    google?: {
      googleId: string
    }
    facebook?: {
      facebookId: string
    }
    twitter?: {
      twitterId: string
    }
    createdAt?: Date
    updatedAt?: Date
  }) {
    this.username = username
    this.email = email
    this.phone = phone
    this.hashPassword = hashPassword
    this.groups = groups
    this.dateOfBirth = dateOfBirth
    this.avatarUrl = avatarUrl
    this.verify = verify
    this.verificationType = verificationType
    this.friends = friends
    this.blockedUsers = blockedUsers
    this.preferences = preferences
    this.privacySettings = privacySettings
    this.google = google
    this.facebook = facebook
    this.twitter = twitter
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}

export const userQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => Number(val)),
  limit: z
    .string()
    .optional()
    .transform((val) => Number(val)),
  sortBy: z.enum(['username', 'email', 'phone']).optional(),
  sortOrder: z.enum(['ASC', 'DESC']).optional(),
  search: z.string().optional()
})
