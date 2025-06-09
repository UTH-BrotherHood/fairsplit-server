import { Collection, Document } from 'mongodb'
import {
  PaginationQuery,
  PaginationInfo,
  PaginatedResponse,
  QueryOptions
} from '~/models/interfaces/pagination.interface'

export class PaginationUtils {
  static DEFAULT_PAGE = 1
  static DEFAULT_LIMIT = 10
  static MAX_LIMIT = 100

  static getPaginationInfo(page: number, limit: number, totalItems: number): PaginationInfo {
    const totalPages = Math.ceil(totalItems / limit)

    return {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  }

  static normalizeQueryParams(query: PaginationQuery): { page: number; limit: number } {
    let page = Number(query.page) || this.DEFAULT_PAGE
    let limit = Number(query.limit) || this.DEFAULT_LIMIT

    // Ensure positive values
    page = Math.max(1, page)
    limit = Math.max(1, Math.min(limit, this.MAX_LIMIT))

    return { page, limit }
  }

  static async paginate<T>(
    collection: Collection<T & Document>,
    query: Record<string, any> = {},
    options: QueryOptions = {},
    paginationQuery: PaginationQuery
  ): Promise<PaginatedResponse<T>> {
    const { page, limit } = this.normalizeQueryParams(paginationQuery)
    const skip = (page - 1) * limit

    const [items, totalItems] = await Promise.all([
      collection
        .find(query, { projection: options.projection })
        .sort(options.sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query)
    ])

    return {
      items: items as T[],
      pagination: this.getPaginationInfo(page, limit, totalItems)
    }
  }

  static getSkipValue(page: number, limit: number): number {
    return (page - 1) * limit
  }
}
