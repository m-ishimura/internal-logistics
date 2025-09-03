import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { itemSchema, paginationSchema } from '@/lib/validation'
import { getUserFromHeaders } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get user data from DB using JWT userId in headers
    const user = await getUserFromHeaders(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const forShipment = queryParams.forShipment === 'true' // 発送用フラグ
    const { error, value } = paginationSchema.validate(queryParams)
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.details },
        { status: 400 }
      )
    }

    const { page, limit, search, sortBy = 'createdAt', sortOrder } = value
    const skip = (page - 1) * limit

    const where: Record<string, any> = {}

    // For shipment creation, all users (including management) can only see their own department's items
    if (forShipment) {
      where.departmentId = user.departmentId
    }
    // For item management, department users can only see their own department's items
    else if (user.role === 'DEPARTMENT_USER') {
      where.departmentId = user.departmentId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { department: { name: { contains: search, mode: 'insensitive' as const } } }
      ]
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          department: true,
          _count: {
            select: { shipments: true }
          }
        }
      }),
      prisma.item.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get items error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user data from DB using JWT userId in headers
    const user = await getUserFromHeaders(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.log('[DEBUG] API - user from DB:', { id: user.id, departmentId: user.departmentId })

    const body = await request.json()
    console.log('[DEBUG] API - request body:', body)
    
    // Automatically set departmentId from authenticated user's department
    const requestData = {
      ...body,
      departmentId: user.departmentId
    }
    console.log('[DEBUG] API - data with departmentId:', requestData)
    
    const { error, value } = itemSchema.validate(requestData)
    console.log('[DEBUG] API - validation result:', { error: error?.details, value })
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.details },
        { status: 400 }
      )
    }

    // All users can only create items for their own department
    if (value.departmentId !== user.departmentId) {
      return NextResponse.json(
        { success: false, error: 'Access denied - can only create items for your department' },
        { status: 403 }
      )
    }

    const item = await prisma.item.create({
      data: value,
      include: {
        department: true
      }
    })

    return NextResponse.json({
      success: true,
      data: item
    }, { status: 201 })
  } catch (error) {
    console.error('Create item error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}