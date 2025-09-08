import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromHeaders } from '@/lib/auth'

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
    
    console.log('[Recent Shipments] Processing with real-time user data:', {
      userId: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId
    })

    return await processRequest(request, user)
  } catch (error) {
    console.error('Get dashboard recent shipments error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processRequest(request: NextRequest, user: any) {
  try {
    console.log('[Recent Shipments] Processing request with user:', {
      userId: user.id,
      role: user.role,
      departmentId: user.departmentId
    })

    const url = new URL(request.url)
    const searchParams = url.searchParams
    
    // フィルターパラメータ
    const filterDepartmentId = searchParams.get('departmentId')
    const filterDestinationDepartmentId = searchParams.get('destinationDepartmentId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // デフォルトの日付範囲（本日-7日〜本日+7日）
    const defaultStartDate = new Date()
    const defaultEndDate = new Date()
    defaultStartDate.setDate(defaultStartDate.getDate() - 7)
    defaultEndDate.setDate(defaultEndDate.getDate() + 7)
    
    const dateStart = startDate ? new Date(startDate) : defaultStartDate
    const dateEnd = endDate ? new Date(endDate) : defaultEndDate
    // 終了日は23:59:59まで含める
    dateEnd.setHours(23, 59, 59, 999)

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
      console.log('[Recent Shipments] Filtering by departmentId for DEPARTMENT_USER:', {
        userId: user.id,
        departmentId: user.departmentId
      })
      additionalFilters.push({ shipmentDepartmentId: user.departmentId })
    } else {
      // 管理者の場合のフィルター
      if (filterDepartmentId && filterDepartmentId !== 'all') {
        additionalFilters.push({ shipmentDepartmentId: parseInt(filterDepartmentId) })
      }
      if (filterDestinationDepartmentId && filterDestinationDepartmentId !== 'all') {
        additionalFilters.push({ destinationDepartmentId: parseInt(filterDestinationDepartmentId) })
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
    console.log('[Recent Shipments] Additional filters applied:', additionalFilters)

    const shipments = await prisma.shipment.findMany({
      where,
      // パフォーマンス向上のため最大100件に制限
      take: 100,
      orderBy: [
        { shippedAt: 'desc' },
        { createdAt: 'desc' }
      ],
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

    return NextResponse.json({
      success: true,
      data: shipments
    })
  } catch (error) {
    console.error('Get dashboard recent shipments error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}