export interface PaginationQuery {
  page?: number | string
  limit?: number | string
  [key: string]: any
}

export interface PaginationInfo {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationInfo
}

export interface QueryOptions {
  sort?: { [key: string]: 1 | -1 }
  projection?: { [key: string]: 1 | 0 }
  populate?: string[]
}
