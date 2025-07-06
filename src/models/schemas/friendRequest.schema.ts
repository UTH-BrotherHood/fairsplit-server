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
