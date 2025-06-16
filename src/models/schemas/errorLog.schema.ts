import { ObjectId } from 'mongodb'
import envConfig from '~/config/env'

export enum ErrorSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical'
}
export interface IErrorLog {
  _id?: ObjectId
  message: string
  stack?: string
  severity: ErrorSeverity
  occurredAt: Date
  metadata?: Record<string, any>
  createdAt?: Date
  updatedAt?: Date
}

export class ErrorLog implements IErrorLog {
  _id?: ObjectId
  message: string
  stack?: string
  severity: ErrorSeverity
  occurredAt: Date
  metadata?: Record<string, any>
  createdAt?: Date
  updatedAt?: Date

  constructor({ message, stack, severity, occurredAt, metadata, createdAt, updatedAt }: IErrorLog) {
    this.message = message
    this.stack = stack
    this.severity = severity
    this.occurredAt = occurredAt
    this.metadata = metadata
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}

export const ErrorLogModel = {
  collectionName: envConfig.dbErrorLogCollection,
  jsonSchema: {
    bsonType: 'object',
    required: ['message', 'severity', 'occurredAt'],
    properties: {
      _id: { bsonType: 'objectId' },
      message: { bsonType: 'string' },
      stack: { bsonType: 'string' },
      severity: {
        enum: Object.values(ErrorSeverity)
      },
      occurredAt: { bsonType: 'date' },
      metadata: { bsonType: 'object' },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' }
    }
  },
  indexes: [{ key: { occurredAt: -1 } }, { key: { severity: 1 } }]
}
