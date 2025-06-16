import { ObjectId } from 'mongodb'

export enum FriendRequestStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled'
}

export interface IFriendRequest {
  _id?: ObjectId
  fromUserId: ObjectId
  toUserId: ObjectId
  status: FriendRequestStatus
  createdAt: Date
  updatedAt?: Date
}

export class FriendRequest implements IFriendRequest {
  _id?: ObjectId
  fromUserId: ObjectId
  toUserId: ObjectId
  status: FriendRequestStatus
  createdAt: Date
  updatedAt?: Date

  constructor({
    fromUserId,
    toUserId,
    status = FriendRequestStatus.Pending,
    createdAt = new Date(),
    updatedAt
  }: {
    fromUserId: ObjectId
    toUserId: ObjectId
    status?: FriendRequestStatus
    createdAt?: Date
    updatedAt?: Date
  }) {
    this.fromUserId = fromUserId
    this.toUserId = toUserId
    this.status = status
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }
}

export const FriendRequestModel = {
  collectionName: 'friend_requests',
  jsonSchema: {
    bsonType: 'object',
    required: ['fromUserId', 'toUserId', 'status', 'createdAt'],
    properties: {
      _id: { bsonType: 'objectId' },
      fromUserId: { bsonType: 'objectId' },
      toUserId: { bsonType: 'objectId' },
      status: {
        enum: Object.values(FriendRequestStatus),
        description: 'Friend request status'
      },
      createdAt: {
        bsonType: 'date',
        description: 'Friend request creation date'
      },
      updatedAt: {
        bsonType: 'date',
        description: 'Friend request last update date'
      }
    }
  },
  indexes: [
    { key: { fromUserId: 1, toUserId: 1 }, unique: true, background: true },
    { key: { status: 1 }, background: true },
    { key: { createdAt: 1 }, background: true }
  ] as const
}
