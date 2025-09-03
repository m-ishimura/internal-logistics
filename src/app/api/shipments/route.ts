import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { shipmentSchema, paginationSchema } from '@/lib/validation'
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
    const { error, value } = paginationSchema.validate(queryParams)
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.details },
        { status: 400 }
      )
    }

    const { 
      page, 
      limit, 
      search, 
      itemId, 
      destination, 
      sourceDepartmentId, 
      shippedFromDate, 
      shippedToDate 
      // sortBy = 'createdAt', 
      // sortOrder 
    } = value
    const skip = (page - 1) * limit

    const where: Record<string, any> = {}

    // Department users can only see their own department's shipments
    if (user.role === 'DEPARTMENT_USER') {
      where.shipmentDepartmentId = user.departmentId
    }

    // 新しい検索条件
    if (itemId) {
      where.itemId = itemId
    }

    if (destination) {
      where.destinationDepartment = {
        name: destination
      }
    }

    if (sourceDepartmentId && user.role === 'MANAGEMENT_USER') {
      where.shipmentDepartmentId = parseInt(sourceDepartmentId)
    }

    if (shippedFromDate || shippedToDate) {
      where.OR = [
        // 発送済みの場合は発送日で検索
        {
          shippedAt: {
            ...(shippedFromDate && { gte: new Date(shippedFromDate) }),
            ...(shippedToDate && { lte: new Date(shippedToDate + 'T23:59:59.999Z') })
          }
        },
        // 未発送の場合は登録日で検索
        {
          AND: [
            { shippedAt: null },
            {
              createdAt: {
                ...(shippedFromDate && { gte: new Date(shippedFromDate) }),
                ...(shippedToDate && { lte: new Date(shippedToDate + 'T23:59:59.999Z') })
              }
            }
          ]
        }
      ]
    }

    // 既存の検索機能（後方互換性のため）
    if (search) {
      const searchCondition = {
        OR: [
          { trackingNumber: { contains: search, mode: 'insensitive' as const } },
          { notes: { contains: search, mode: 'insensitive' as const } },
          { item: { name: { contains: search, mode: 'insensitive' as const } } }
        ]
      }
      
      if (where.OR) {
        where.AND = [{ OR: where.OR }, searchCondition]
        delete where.OR
      } else {
        Object.assign(where, searchCondition)
      }
    }

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { shippedAt: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' }
        ],
        include: {
          item: true,
          sender: {
            select: { id: true, name: true, email: true }
          },
          shipmentDepartment: true,
          destinationDepartment: true,
          shipmentUser: {
            select: { id: true, name: true, email: true }
          },
          creator: {
            select: { id: true, name: true, email: true }
          },
          updater: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.shipment.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: shipments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get shipments error:', error)
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

    const body = await request.json()
    const { error, value } = shipmentSchema.validate(body)
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.details },
        { status: 400 }
      )
    }

    // Verify the item belongs to the user's department (for department users)
    if (user.role === 'DEPARTMENT_USER') {
      const item = await prisma.item.findUnique({
        where: { id: value.itemId }
      })

      if (!item || item.departmentId !== user.departmentId) {
        return NextResponse.json(
          { success: false, error: 'Item not found or access denied' },
          { status: 403 }
        )
      }
    }

    const shipment = await prisma.shipment.create({
      data: {
        ...value,
        senderId: user.id,
        createdBy: user.id,
        updatedBy: user.id
      },
      include: {
        item: true,
        sender: {
          select: { id: true, name: true, email: true }
        },
        shipmentDepartment: true,
        destinationDepartment: true,
        shipmentUser: {
          select: { id: true, name: true, email: true }
        },
        creator: {
          select: { id: true, name: true, email: true }
        },
        updater: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: shipment
    }, { status: 201 })
  } catch (error) {
    console.error('Create shipment error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}