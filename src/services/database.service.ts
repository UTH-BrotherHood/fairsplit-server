'use strict'

import { Collection, Db, MongoClient } from 'mongodb'
import { IToken } from '~/models/schemas/token.schema'
import { IUser } from '~/models/schemas/user.schema'
import config from '~/config/env'

export class DatabaseServices {
  private client: MongoClient
  private db: Db
  private static instance: DatabaseServices

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

  public getClient() {
    return this.client
  }

  async connect() {
    try {
      await this.client.connect()
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log('Error connecting to the database', error)
      throw error
    }
  }

  get users(): Collection<IUser> {
    return this.db.collection(config.dbUserCollection)
  }

  get tokens(): Collection<IToken> {
    return this.db.collection(config.dbTokenCollection)
  }
}

const databaseServices = new DatabaseServices()
export default databaseServices
