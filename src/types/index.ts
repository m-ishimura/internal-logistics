export type UserRole = 'DEPARTMENT_USER' | 'MANAGEMENT_USER'
export type AuthType = 'ENTRA_ID' | 'PASSWORD'
export type BulkImportStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface User {
  id: number
  entraId?: string | null
  email: string
  name: string
  passwordHash?: string | null
  departmentId: number
  role: UserRole
  authType: AuthType
  createdAt: Date
  updatedAt: Date
  department?: Department
}

export interface Department {
  id: number
  name: string
  code?: string | null
  isManagement: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Item {
  id: string
  name: string
  unit?: string | null
  departmentId: number
  createdAt: Date
  updatedAt: Date
  department?: Department
  _count?: {
    shipments: number
  }
}

export interface Shipment {
  id: string
  itemId: string
  quantity: number
  senderId: number
  shipmentDepartmentId: number
  destinationDepartmentId: number
  trackingNumber?: string | null
  notes?: string | null
  shippedAt?: Date | null
  createdBy: number
  updatedBy: number
  createdAt: Date
  updatedAt: Date
  item?: Item
  sender?: User
  shipmentDepartment?: Department
  destinationDepartment?: Department
  creator?: User
  updater?: User
}

export interface BulkImport {
  id: string
  fileName: string
  totalRecords: number
  successRecords: number
  errorRecords: number
  uploadedBy: number
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
  refreshAuth: () => Promise<void>
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