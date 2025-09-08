import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromHeaders } from '@/lib/auth'
import Joi from 'joi'

// recent-shipments API専用のスキーマ（基本的なページネーション + フィルターパラメータ）
const recentShipmentsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(1000).default(50),
  startDate: Joi.string().optional().allow(null, ''),
  endDate: Joi.string().optional().allow(null, ''),
  destinationDepartmentId: Joi.string().optional().allow(null, '')
})

export async function GET(request: NextRequest) {
  try {
    // Get user data from DB using JWT userId in headers
    const user = await getUserFromHeaders(request)
    
    if (!user) {
      console.error('[Recent Shipments] User not found or not authenticated')
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.log('[Recent Shipments] Processing with user:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId
    })

    return await processRequest(request, user)
  } catch (error) {
    console.error('[Recent Shipments] Main error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processRequest(request: NextRequest, user: any) {
  try {
    const url = new URL(request.url)
    const searchParams = url.searchParams
    
    // パラメータを取得し、型変換
    const rawParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      destinationDepartmentId: searchParams.get('destinationDepartmentId')
    }
    
    console.log('[Recent Shipments] Raw params:', rawParams)

    // 型変換後のパラメータ
    const queryParams = {
      page: rawParams.page ? parseInt(rawParams.page) : 1,
      limit: rawParams.limit ? parseInt(rawParams.limit) : 50,
      startDate: rawParams.startDate || null,
      endDate: rawParams.endDate || null,
      destinationDepartmentId: rawParams.destinationDepartmentId || null
    }

    console.log('[Recent Shipments] Converted params:', queryParams)

    // バリデーション
    const { error: validationError, value } = recentShipmentsSchema.validate(queryParams)
    if (validationError) {
      console.error('[Recent Shipments] Validation error:', {
        message: validationError.details[0].message,
        details: validationError.details,
        input: queryParams
      })
      return NextResponse.json(
        { success: false, error: `Validation error: ${validationError.details[0].message}` },
        { status: 400 }
      )
    }

    console.log('[Recent Shipments] Validation successful:', value)

    const { page, limit, startDate, endDate, destinationDepartmentId } = value
    
    // デフォルトの日付範囲（本日-7日〜本日+7日）
    const defaultStartDate = new Date()
    const defaultEndDate = new Date()
    defaultStartDate.setDate(defaultStartDate.getDate() - 7)
    defaultEndDate.setDate(defaultEndDate.getDate() + 7)
    
    const dateStart = startDate ? new Date(startDate) : defaultStartDate
    const dateEnd = endDate ? new Date(endDate) : defaultEndDate
    // 終了日は23:59:59まで含める
    dateEnd.setHours(23, 59, 59, 999)

    console.log('[Recent Shipments] Date range:', { dateStart, dateEnd })

    // WHERE条件の構築（発送済みと未発送の両方を含める）
    let where: Record<string, any> = {
      OR: [
        // 発送済みの場合は発送日で検索
        {
          shippedAt: {
            gte: dateStart,
            lte: dateEnd
          }
        },
        // 未発送の場合は登録日で検索
        {
          shippedAt: null,
          createdAt: {
            gte: dateStart,
            lte: dateEnd
          }
        }
      ]
    }

    // 部署フィルター
    const additionalFilters: Record<string, any>[] = []
    
    if (user.role === 'DEPARTMENT_USER') {
      // 部署ユーザーは自部署の発送のみ表示
      console.log('[Recent Shipments] Adding department filter for DEPARTMENT_USER:', user.departmentId)
      additionalFilters.push({ shipmentDepartmentId: user.departmentId })
    } else {
      // 管理者の場合のフィルター
      if (destinationDepartmentId && destinationDepartmentId !== 'all') {
        console.log('[Recent Shipments] Adding destination department filter:', destinationDepartmentId)
        additionalFilters.push({ destinationDepartmentId: parseInt(destinationDepartmentId) })
      }
    }
    
    if (additionalFilters.length > 0) {
      where = {
        AND: [
          { OR: where.OR },
          ...additionalFilters
        ]
      }
    }

    console.log('[Recent Shipments] Final WHERE clause:', JSON.stringify(where, null, 2))

    // 総件数を取得
    const totalCount = await prisma.shipment.count({ where })
    console.log('[Recent Shipments] Total count:', totalCount)

    const shipments = await prisma.shipment.findMany({
      where,
      orderBy: [
        { shippedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        quantity: true,
        destinationDepartmentId: true,
        notes: true,
        shippedAt: true,
        createdAt: true,
        trackingNumber: true,
        item: {
          select: {
            id: true,
            name: true,
            unit: true
          }
        },
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        shipmentDepartment: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        destinationDepartment: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        shipmentUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    const totalPages = Math.ceil(totalCount / limit)

    console.log('[Recent Shipments] Query successful:', {
      totalCount,
      shipmentsReturned: shipments.length,
      page,
      limit,
      totalPages
    })

    return NextResponse.json({
      success: true,
      data: shipments,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      }
    })
  } catch (error) {
    console.error('[Recent Shipments] Process error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}