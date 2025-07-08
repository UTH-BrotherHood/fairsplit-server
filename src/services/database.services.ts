import { Collection, Db, MongoClient } from 'mongodb'
import { IToken } from '~/models/schemas/token.schema'
import { IUser } from '~/models/schemas/user.schema'
import envConfig from '~/config/env'
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
import { IShoppingList } from '~/models/schemas/shoppingList.schema'
import { IUserAnalytics } from '~/models/schemas/userAnalytics.schema'

export class DatabaseServices {
  private client: MongoClient
  private db: Db

  constructor() {
    const uri = envConfig.mongodbUri
    if (!uri) {
      throw new Error('MongoDB URI is not provided in environment variables')
    }

    this.client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 5,
      retryWrites: true,
      w: 'majority'
    })
    this.db = this.client.db(envConfig.dbName)
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
    return this.db.collection<IUser>(envConfig.dbUserCollection)
  }

  get tokens(): Collection<IToken> {
    return this.db.collection<IToken>(envConfig.dbTokenCollection)
  }

  get admins(): Collection<IAdmin> {
    return this.db.collection<IAdmin>(envConfig.dbAdminCollection)
  }

  get verificationCodes(): Collection<IVerificationCode> {
    return this.db.collection<IVerificationCode>(envConfig.dbVerificationCodeCollection)
  }

  get groups(): Collection<IGroup> {
    return this.db.collection<IGroup>(envConfig.dbGroupCollection)
  }

  get transactions(): Collection<ITransaction> {
    return this.db.collection<ITransaction>(envConfig.dbTransactionCollection)
  }

  get notifications(): Collection<INotification> {
    return this.db.collection<INotification>(envConfig.dbNotificationCollection)
  }

  get settings(): Collection<ISetting> {
    return this.db.collection<ISetting>(envConfig.dbSettingCollection)
  }

  get errorLogs(): Collection<IErrorLog> {
    return this.db.collection<IErrorLog>(envConfig.dbErrorLogCollection)
  }

  get auditLogs(): Collection<IAuditLog> {
    return this.db.collection<IAuditLog>(envConfig.dbAuditLogCollection)
  }

  get categories(): Collection<ICategory> {
    return this.db.collection<ICategory>(envConfig.dbCategoryCollection)
  }

  get bills(): Collection<IBill> {
    return this.db.collection<IBill>(envConfig.dbBillCollection)
  }

  get debts(): Collection<IDebt> {
    return this.db.collection<IDebt>(envConfig.dbDebtCollection)
  }

  get shoppingLists(): Collection<IShoppingList> {
    return this.db.collection<IShoppingList>(envConfig.dbShoppingListCollection)
  }

  get friendRequests(): Collection<IFriendRequest> {
    return this.db.collection<IFriendRequest>(envConfig.dbFriendRequestCollection)
  }

  get userAnalytics(): Collection<IUserAnalytics> {
    return this.db.collection<IUserAnalytics>(envConfig.dbUserAnalyticsCollection)
  }
}

const databaseServices = new DatabaseServices()
export default databaseServices
