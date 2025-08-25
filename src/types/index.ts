export type UserRole = 'DEPARTMENT_USER' | 'MANAGEMENT_USER'
export type AuthType = 'ENTRA_ID' | 'PASSWORD'
export type BulkImportStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface User {
  id: string
  entraId?: string
  email: string
  name: string
  passwordHash?: string
  departmentId: string
  role: UserRole
  authType: AuthType
  createdAt: Date
  updatedAt: Date
  department?: Department
}

export interface Department {
  id: string
  name: string
  code: string
  isManagement: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Item {
  id: string
  name: string
  category: string
  unit: string
  departmentId: string
  createdAt: Date
  updatedAt: Date
  department?: Department
}

export interface Shipment {
  id: string
  itemId: string
  quantity: number
  senderId: string
  departmentId: string
  destination: string
  trackingNumber?: string
  notes?: string
  shippedAt?: Date
  createdAt: Date
  updatedAt: Date
  item?: Item
  sender?: User
  department?: Department
}

export interface BulkImport {
  id: string
  fileName: string
  totalRecords: number
  successRecords: number
  errorRecords: number
  uploadedBy: string
  status: BulkImportStatus
  createdAt: Date
  updatedAt: Date
  uploader?: User
  errors?: BulkImportError[]
}

export interface BulkImportError {
  id: string
  bulkImportId: string
  rowNumber: number
  errorMessage: string
  rowData: any
  createdAt: Date
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  loginWithEntraId: () => Promise<void>
  logout: () => void
  loading: boolean
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}