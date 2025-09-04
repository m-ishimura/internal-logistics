import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { departmentSchema, paginationSchema } from '@/lib/validation'
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
    
    // 発送用の場合は全ユーザーがアクセス可能、それ以外は管理者のみ
    if (!forShipment && user.role !== 'MANAGEMENT_USER') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const { error, value } = paginationSchema.validate(queryParams)
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.details },
        { status: 400 }
      )
    }

    const { page, limit, search, sortBy = 'id', sortOrder } = value
    
    // 部署一覧は全データを表示（ページネーションなし）
    const finalSortBy = sortBy || 'id'
    const finalSortOrder = sortOrder || 'asc'
    const skip = forShipment ? 0 : (page - 1) * limit
    const take = forShipment ? undefined : limit

    const where = search 
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } }
          ]
        }
      : {}

    // 発送用の場合は統計情報は不要なので軽量化
    const includeStats = !forShipment

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        ...(take && { skip, take }),
        orderBy: { [finalSortBy]: finalSortOrder },
        ...(includeStats && {
          include: {
            _count: {
              select: { 
                users: true, 
                items: true, 
                shipmentDepartments: true,
                destinationShipments: true
              }
            }
          }
        })
      }),
      prisma.department.count({ where })
    ])


    return NextResponse.json({
      success: true,
      data: departments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get departments error:', error)
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
    
    if (user.role !== 'MANAGEMENT_USER') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { error, value } = departmentSchema.validate(body)
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.details },
        { status: 400 }
      )
    }

    const department = await prisma.department.create({
      data: value
    })

    return NextResponse.json({
      success: true,
      data: department
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create department error:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Department code already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}