import { config } from 'dotenv'
import argv from 'minimist'
import type { StringValue } from 'ms'

const options = argv(process.argv.slice(2))

config({
  path: options.env ? `.env.${options.env}` : '.env'
})

export const envConfig = {
  // Server Configuration
  port: process.env.PORT as string,
  clientUrl: process.env.CLIENT_URL as string,
  mongodbUri: process.env.MONGODB_URI as string,

  // Database Connection
  dbUsername: process.env.DB_USERNAME as string,
  dbPassword: process.env.DB_PASSWORD as string,
  dbName: process.env.DB_NAME as string,
  appName: process.env.APP_NAME as string,

  // Encription
  encryptionKey: process.env.ENCRYPTION_KEY as string,

  // Authentication
  jwtSecretAccessToken: process.env.JWT_SECRET_ACCESS_TOKEN as string,
  jwtSecretRefreshToken: process.env.JWT_SECRET_REFRESH_TOKEN as string,
  accessTokenExpiresIn: process.env.JWT_EXPIRES_IN_ACCESS_TOKEN as number | StringValue,
  refreshTokenExpiresIn: process.env.JWT_EXPIRES_IN_REFRESH_TOKEN as number | StringValue,
  jwtSecretEmailVerifyToken: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string | StringValue,
  emailVerifyTokenExpiresIn: process.env.JWT_EXPIRES_IN_EMAIL_VERIFY_TOKEN as number | StringValue,

  // SMTP Configuration
  smtpHost: process.env.SMTP_HOST as string,
  smtpPort: parseInt(process.env.SMTP_PORT as string) || 587,
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER as string,
  smtpPassword: process.env.SMTP_PASSWORD as string,

  // OTP Configuration
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID as string,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN as string,
  twilioServiceSid: process.env.TWILIO_SERVICE_SID as string,

  // google oauth20
  googleClientId: process.env.GOOGLE_CLIENT_ID as string,

  // Redis
  redisHost: process.env.REDIS_HOST as string,
  redisPort: parseInt(process.env.REDIS_PORT as string),
  redisPassword: process.env.REDIS_PASSWORD as string,
  redisDb: parseInt(process.env.REDIS_DB as string),
  redisExpireTime: process.env.REDIS_EXPIRE_TIME as number | StringValue,
  redisPrefix: process.env.REDIS_PREFIX as string,
  redisUrl:
    process.env.REDIS_URL ||
    (process.env.REDIS_PASSWORD
      ? `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.REDIS_DB || 0}`
      : `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.REDIS_DB || 0}`),

  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY as string,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET as string,

  // AWS S3
  awsRegion: process.env.AWS_REGION as string,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  awsS3Bucket: process.env.AWS_S3_BUCKET as string,

  // File Upload
  defaultUploadService: (process.env.DEFAULT_UPLOAD_SERVICE as 'cloudinary' | 's3') || 'cloudinary',

  // Collections
  dbUserCollection: process.env.DB_USER_COLLECTION as string,
  dbTokenCollection: process.env.DB_TOKEN_COLLECTION as string,
  dbAdminCollection: process.env.DB_ADMIN_COLLECTION as string,
  dbVerificationCodeCollection: process.env.DB_VERIFICATION_CODE_COLLECTION as string,
  dbCategoryCollection: process.env.DB_CATEGORY_COLLECTION as string,
  dbNotificationCollection: process.env.DB_NOTIFICATION_COLLECTION as string,
  dbUserAnalyticsCollection: process.env.DB_USER_ANALYTICS_COLLECTION as string,
  dbGroupCollection: process.env.DB_GROUP_COLLECTION as string,
  dbTransactionCollection: process.env.DB_TRANSACTION_COLLECTION as string,
  dbShoppingListCollection: process.env.DB_SHOPPING_LIST_COLLECTION as string,
  dbBillCollection: process.env.DB_BILL_COLLECTION as string,
  dbDebtCollection: process.env.DB_DEBT_COLLECTION as string,
  dbSettingCollection: process.env.DB_SETTING_COLLECTION as string,
  dbErrorLogCollection: process.env.DB_ERROR_LOG_COLLECTION as string,
  dbAuditLogCollection: process.env.DB_AUDIT_LOG_COLLECTION as string,
  dbFriendRequestCollection: process.env.DB_FRIEND_REQUEST_COLLECTION as string
} as const
