import { ObjectId } from 'mongodb'
import envConfig from '~/config/env'

export enum UserVerificationStatus {
  Unverified = 'Unverified',
  Verified = 'Verified'
}

export enum UserVerificationType {
  Email = 'Email',
  Phone = 'Phone'
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

export const UserModel = {
  collectionName: envConfig.dbUserCollection,
  jsonSchema: {
    bsonType: 'object',
    required: [
      'username',
      'verify',
      'groups',
      'hashPassword',
      'dateOfBirth',
      'avatarUrl',
      'verificationType',
      'createdAt',
      'updatedAt'
    ],
    properties: {
      _id: { bsonType: 'objectId' },
      username: {
        bsonType: 'string',
        minLength: 3,
        maxLength: 50,
        description: 'Username must be between 3 and 50 characters'
      },
      email: {
        bsonType: ['string', 'null'],
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        description: 'Email must be a valid email address'
      },
      phone: {
        bsonType: ['string', 'null'],
        pattern: '^\\+?[1-9]\\d{1,14}$',
        description: 'Phone must be a valid phone number in E.164 format'
      },
      dateOfBirth: {
        bsonType: 'date',
        description: 'User date of birth'
      },
      groups: {
        bsonType: 'array',
        items: {
          bsonType: 'objectId'
        },
        description: 'User groups'
      },
      hashPassword: {
        bsonType: 'string',
        description: 'User password hash'
      },
      avatarUrl: {
        bsonType: ['string', 'null'],
        description: 'URL to user avatar image'
      },
      verify: {
        enum: Object.values(UserVerificationStatus),
        description: 'User verification status'
      },
      verificationType: {
        enum: Object.values(UserVerificationType),
        description: 'User verification type (email or phone)'
      },
      friends: {
        bsonType: 'array',
        items: {
          bsonType: 'objectId'
        },
        description: 'User friends'
      },
      blockedUsers: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['userId', 'createdAt'],
          properties: {
            userId: { bsonType: 'objectId' },
            reason: { bsonType: 'string' },
            createdAt: { bsonType: 'date' }
          }
        },
        description: 'Users blocked by this user'
      },
      preferences: {
        bsonType: 'object',
        properties: {
          language: { bsonType: 'string' },
          theme: { bsonType: 'string' },
          notifications: {
            bsonType: 'object',
            properties: {
              email: { bsonType: 'bool' },
              push: { bsonType: 'bool' },
              sms: { bsonType: 'bool' }
            }
          }
        }
      },
      privacySettings: {
        bsonType: 'object',
        properties: {
          profileVisibility: {
            enum: ['public', 'friends', 'private']
          },
          friendRequests: {
            enum: ['everyone', 'friendsOfFriends', 'none']
          }
        }
      },
      createdAt: {
        bsonType: 'date',
        description: 'User creation date'
      },
      updatedAt: {
        bsonType: 'date',
        description: 'User last update date'
      },
      google: {
        bsonType: 'object',
        properties: {
          googleId: { bsonType: 'string' }
        }
      },
      facebook: {
        bsonType: 'object',
        properties: {
          facebookId: { bsonType: 'string' }
        }
      },
      twitter: {
        bsonType: 'object',
        properties: {
          twitterId: { bsonType: 'string' }
        }
      }
    }
  },
  indexes: [
    { key: { email: 1 }, unique: true, sparse: true, background: true },
    { key: { phone: 1 }, unique: true, sparse: true, background: true },
    { key: { username: 1 }, unique: true, background: true }
  ] as const
}
