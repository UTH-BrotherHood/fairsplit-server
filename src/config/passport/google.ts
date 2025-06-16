import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20'
import databaseServices from '~/services/database.services'
import { ObjectId } from 'mongodb'
import { logger } from '~/loggers/my-logger.log'
import { envConfig } from '~/config/env'
import { IUser } from '~/models/schemas/user.schema'
import { UserVerificationStatus } from '~/models/schemas/user.schema'
import { Request } from 'express'

export const googleStrategy = new GoogleStrategy(
  {
    clientID: envConfig.googleClientId,
    clientSecret: envConfig.googleClientSecret,
    callbackURL:
      process.env.NODE_ENV === 'development' ? envConfig.googleCallbackURLDev : envConfig.googleCallbackURLProd,
    scope: ['profile', 'email'],
    passReqToCallback: true
  },
  async (req: Request, accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
    try {
      logger.info(`Google auth attempt for profile ID ${profile.id}`, 'passport.googleStrategy')

      const existingUserByGoogleId = await databaseServices.users.findOne({ googleId: profile.id })
      if (existingUserByGoogleId) {
        logger.info(`User found with Google ID: ${profile.id}`, 'passport.googleStrategy')

        if (existingUserByGoogleId.verify !== UserVerificationStatus.Verified) {
          await databaseServices.users.updateOne(
            { _id: existingUserByGoogleId._id },
            {
              $set: {
                verify: UserVerificationStatus.Verified,
                updatedAt: new Date()
              }
            }
          )
          logger.info(
            `Updated user verification status: ${existingUserByGoogleId._id.toString()}`,
            'passport.googleStrategy'
          )

          const updatedUser = await databaseServices.users.findOne({ _id: existingUserByGoogleId._id })
          if (!updatedUser) {
            logger.error(
              `Failed to find updated user: ${existingUserByGoogleId._id.toString()}`,
              'passport.googleStrategy'
            )
            return done(new Error('User update failed'), false)
          }
          return done(null, updatedUser)
        }

        return done(null, existingUserByGoogleId)
      }

      const email = profile.emails?.[0]?.value
      if (!email) {
        logger.error('Email is required for Google authentication', 'passport.googleStrategy')
        return done(new Error('Email is required for authentication'), false)
      }

      const existingUserByEmail = await databaseServices.users.findOne({ email })

      if (existingUserByEmail) {
        await databaseServices.users.updateOne(
          { _id: existingUserByEmail._id },
          {
            $set: {
              google: {
                googleId: profile.id
              },
              verify: UserVerificationStatus.Verified,
              avatarUrl: existingUserByEmail.avatarUrl || profile.photos?.[0]?.value || '',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        )

        logger.info(`Updated existing user with Google ID: ${profile.id}`, 'passport.googleStrategy')

        const updatedUser = await databaseServices.users.findOne({ _id: existingUserByEmail._id })

        if (!updatedUser) {
          logger.error(`Failed to find updated user: ${existingUserByEmail._id.toString()}`, 'passport.googleStrategy')
          return done(new Error('User update failed'), false)
        }

        return done(null, updatedUser)
      }

      const userId = new ObjectId()
      const profileJson = profile._json as any // eslint-disable-line @typescript-eslint/no-explicit-any

      const newUser: Partial<IUser> = {
        _id: userId,
        google: {
          googleId: profile.id
        },
        email: email,
        username: profile.displayName,
        avatarUrl: profile.photos?.[0]?.value || '',
        dateOfBirth: profileJson.birthday ? new Date(profileJson.birthday) : new Date(),
        verify: UserVerificationStatus.Verified,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await databaseServices.users.insertOne(newUser as IUser)
      logger.info(`Created new user from Google OAuth: ${userId.toString()}`, 'passport.googleStrategy')

      const createdUser = await databaseServices.users.findOne({ _id: result.insertedId })

      if (!createdUser) {
        logger.error(`Failed to find newly created user: ${userId.toString()}`, 'passport.googleStrategy')
        return done(new Error('User creation failed'), false)
      }

      return done(null, createdUser)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Google authentication error: ${errorMessage}`, 'passport.googleStrategy')
      return done(error, false)
    }
  }
)
