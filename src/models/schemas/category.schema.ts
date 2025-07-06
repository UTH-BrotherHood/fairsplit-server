import { ObjectId } from 'mongodb'

export interface ICategory {
  _id?: ObjectId
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export class Category implements ICategory {
  _id?: ObjectId
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date

  constructor({ name, description, createdAt, updatedAt }: ICategory) {
    this.name = name
    this.description = description
    this.createdAt = createdAt || new Date()
    this.updatedAt = updatedAt || new Date()
  }
}
