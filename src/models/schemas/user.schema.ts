import { ObjectId } from 'mongodb'
import envConfig from '~/config/env'
import { roles } from '~/config/role'

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
  role: string
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
  role: string
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
    role = 'User',
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
    role?: string
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
    this.role = role
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
      'role',
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
      role: {
        bsonType: 'string',
        enum: Object.values(roles),
        description: 'User role'
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
