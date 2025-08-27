import Joi from 'joi'

export const departmentSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  code: Joi.string().max(10).optional().allow(null, ''),
  isManagement: Joi.boolean().required()
})

export const itemSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  unit: Joi.string().min(1).max(20).optional().allow(null, ''),
  departmentId: Joi.number().integer().required()
})

export const shipmentSchema = Joi.object({
  itemId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  senderId: Joi.number().integer().required(),
  shipmentDepartmentId: Joi.number().integer().required(),
  destinationDepartmentId: Joi.number().integer().required(),
  trackingNumber: Joi.string().max(100).optional().allow(''),
  notes: Joi.string().max(500).optional().allow(''),
  shippedAt: Joi.date().optional(),
  createdBy: Joi.number().integer().required(),
  updatedBy: Joi.number().integer().required()
})

export const userSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(1).max(100).required(),
  password: Joi.string().min(6).optional(),
  departmentId: Joi.number().integer().required(),
  role: Joi.string().valid('DEPARTMENT_USER', 'MANAGEMENT_USER').required(),
  authType: Joi.string().valid('PASSWORD', 'ENTRA_ID').default('PASSWORD'),
  entraId: Joi.string().optional().allow('')
})

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(1000).default(20),
  search: Joi.string().max(100).optional(),
  sortBy: Joi.string().max(50).optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  forShipment: Joi.string().optional()
})