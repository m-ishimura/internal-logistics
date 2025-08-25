import Joi from 'joi'

export const departmentSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  code: Joi.string().min(1).max(10).required(),
  isManagement: Joi.boolean().required()
})

export const itemSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  category: Joi.string().min(1).max(100).required(),
  unit: Joi.string().min(1).max(20).required(),
  departmentId: Joi.string().required()
})

export const shipmentSchema = Joi.object({
  itemId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  destination: Joi.string().min(1).max(200).required(),
  trackingNumber: Joi.string().max(100).optional().allow(''),
  notes: Joi.string().max(500).optional().allow(''),
  shippedAt: Joi.date().optional()
})

export const userSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(1).max(100).required(),
  password: Joi.string().min(6).required(),
  departmentId: Joi.string().required(),
  role: Joi.string().valid('DEPARTMENT_USER', 'MANAGEMENT_USER').required()
})

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(100).optional(),
  sortBy: Joi.string().max(50).optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
})