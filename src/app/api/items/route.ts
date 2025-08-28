import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { itemSchema, paginationSchema } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    // const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    const departmentId = request.headers.get('x-department-id')

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
    if (forShipment && departmentId) {
      where.departmentId = parseInt(departmentId)
    }
    // For item management, department users can only see their own department's items
    else if (userRole === 'DEPARTMENT_USER' && departmentId) {
      where.departmentId = parseInt(departmentId)
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
    const userRole = request.headers.get('x-user-role')
    const departmentId = request.headers.get('x-department-id')

    const body = await request.json()
    const { error, value } = itemSchema.validate(body)
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.details },
        { status: 400 }
      )
    }

    // Department users can only create items for their own department
    if (userRole === 'DEPARTMENT_USER' && value.departmentId !== departmentId) {
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