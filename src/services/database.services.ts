import { Collection, Db, MongoClient } from 'mongodb'
import { IToken } from '~/models/schemas/token.schema'
import { IUser } from '~/models/schemas/user.schema'
import config from '~/config/env'
import { IVerificationCode } from '~/models/schemas/verificationCode.schema'
import { IGroup } from '~/models/schemas/group.schema'
import { ITransaction } from '~/models/schemas/transaction.schema'
import { INotification } from '~/models/schemas/notification.schema'
import { ISetting } from '~/models/schemas/setting.schema'
import { IErrorLog } from '~/models/schemas/errorLog.schema'
import { IAuditLog } from '~/models/schemas/auditLog.schema'
import { IAdmin } from '~/models/schemas/admin.schema'
import { ICategory } from '~/models/schemas/category.schema'
import { IBill } from '~/models/schemas/bill.schema'
import { IFriendRequest } from '~/models/schemas/friendRequest.schema'
import { IDebt } from '~/models/schemas/debt.schema'

export class DatabaseServices {
  private client: MongoClient
  private db: Db

  constructor() {
    const uri = config.mongodbUri
    if (!uri) {
      throw new Error('MongoDB URI is not provided in environment variables')
    }

    this.client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 5,
      retryWrites: true,
      w: 'majority'
    })
    this.db = this.client.db(config.dbName)
  }

  async connect() {
    try {
      await this.client.connect()
      await this.db.command({ ping: 1 })
      console.log('You successfully connected to MongoDB!')
    } catch (error) {
      console.log('Error connecting to the database', error)
      await this.client.close()
      throw error
    }
  }

  async disconnect() {
    try {
      await this.client.close()
      console.log('Disconnected from the database')
    } catch (error) {
      console.error('Error disconnecting from the database:', error)
      throw error
    }
  }

  get users(): Collection<IUser> {
    return this.db.collection<IUser>(config.dbUserCollection)
  }

  get tokens(): Collection<IToken> {
    return this.db.collection<IToken>(config.dbTokenCollection)
  }

  get admins(): Collection<IAdmin> {
    return this.db.collection<IAdmin>(config.dbAdminCollection)
  }

  get verificationCodes(): Collection<IVerificationCode> {
    return this.db.collection<IVerificationCode>(config.dbVerificationCodeCollection)
  }

  get groups(): Collection<IGroup> {
    return this.db.collection<IGroup>(config.dbGroupCollection)
  }

  get transactions(): Collection<ITransaction> {
    return this.db.collection<ITransaction>(config.dbTransactionCollection)
  }

  get notifications(): Collection<INotification> {
    return this.db.collection<INotification>(config.dbNotificationCollection)
  }

  get settings(): Collection<ISetting> {
    return this.db.collection<ISetting>(config.dbSettingCollection)
  }

  get errorLogs(): Collection<IErrorLog> {
    return this.db.collection<IErrorLog>(config.dbErrorLogCollection)
  }

  get auditLogs(): Collection<IAuditLog> {
    return this.db.collection<IAuditLog>(config.dbAuditLogCollection)
  }

  get categories(): Collection<ICategory> {
    return this.db.collection<ICategory>(config.dbCategoryCollection)
  }

  get bills(): Collection<IBill> {
    return this.db.collection<IBill>(config.dbBillCollection)
  }

  get debts(): Collection<IDebt> {
    return this.db.collection<IDebt>(config.dbDebtCollection)
  }

  get friendRequests(): Collection<IFriendRequest> {
    return this.db.collection<IFriendRequest>(config.dbFriendRequestCollection)
  }
}

const databaseServices = new DatabaseServices()
export default databaseServices
