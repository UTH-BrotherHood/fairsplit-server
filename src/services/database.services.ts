import { Collection, Db, IndexDescription, MongoClient } from 'mongodb'
import { IToken, TokenModel } from '~/models/schemas/token.schema'
import { IUser, UserModel } from '~/models/schemas/user.schema'
import config from '~/config/env'
import { IVerificationCode, VerificationCodeModel } from '~/models/schemas/verificationCode.schema'
import { CategoryModel } from '~/models/schemas/category.schema'

export class DatabaseServices {
  private client: MongoClient
  private db: Db

  constructor() {
    const uri = config.mongodbUri
    if (!uri) {
      throw new Error('MongoDB URI is not provided in environment variables')
    }

    // Add logging to debug
    console.log('MongoDB URI:', uri)

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

      // await this.initCollections()
    } catch (error) {
      console.log('Error connecting to the database', error)
      await this.client.close()
      throw error
    }
  }

  // private async initCollections() {
  //   const collections = await this.db.listCollections().toArray()
  //   const collectionNames = collections.map((c) => c.name)

  //   if (!collectionNames.includes(config.dbUserCollection)) {
  //     await this.db.createCollection(config.dbUserCollection, {
  //       validator: {
  //         $jsonSchema: UserModel.jsonSchema
  //       }
  //     })
  //     await this.users.createIndexes([...UserModel.indexes] as unknown as IndexDescription[])
  //   }

  //   if (!collectionNames.includes(config.dbTokenCollection)) {
  //     await this.db.createCollection(config.dbTokenCollection, {
  //       validator: {
  //         $jsonSchema: TokenModel.jsonSchema
  //       }
  //     })
  //     //   await this.tokens.createIndexes([...TokenModel.indexes] as unknown as IndexDescription[])
  //   }

  //   if (!collectionNames.includes(config.dbVerificationCodeCollection)) {
  //     await this.db.createCollection(config.dbVerificationCodeCollection, {
  //       validator: {
  //         $jsonSchema: VerificationCodeModel.jsonSchema
  //       }
  //     })
  //     //   await this.verificationCodes.createIndexes([...VerificationCodeModel.indexes] as unknown as IndexDescription[])
  //   }

  //   if (!collectionNames.includes(config.dbCategoryCollection)) {
  //     await this.db.createCollection(config.dbCategoryCollection, {
  //       validator: {
  //         $jsonSchema: CategoryModel.jsonSchema
  //       }
  //     })
  //   }
  // }

  get users(): Collection<IUser> {
    return this.db.collection(config.dbUserCollection)
  }

  get tokens(): Collection<IToken> {
    return this.db.collection(config.dbTokenCollection)
  }

  get verificationCodes(): Collection<IVerificationCode> {
    return this.db.collection(config.dbVerificationCodeCollection)
  }
}

const databaseServices = new DatabaseServices()
export default databaseServices
