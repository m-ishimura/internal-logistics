import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    const departmentId = request.headers.get('x-department-id')

    const url = new URL(request.url)
    const searchParams = url.searchParams
    
    // フィルターパラメータ
    const filterDepartmentId = searchParams.get('departmentId')
    const filterDestinationDepartmentId = searchParams.get('destinationDepartmentId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // デフォルトの日付範囲（本日-7日〜本日）
    const defaultEndDate = new Date()
    const defaultStartDate = new Date()
    defaultStartDate.setDate(defaultStartDate.getDate() - 7)
    
    const dateStart = startDate ? new Date(startDate) : defaultStartDate
    const dateEnd = endDate ? new Date(endDate) : defaultEndDate
    // 終了日は23:59:59まで含める
    dateEnd.setHours(23, 59, 59, 999)

    // WHERE条件の構築（発送済みと未発送の両方を含める）
    let where: any = {
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
    const additionalFilters: any[] = []
    
    if (userRole === 'DEPARTMENT_USER') {
      // 部署ユーザーは自部署の発送のみ表示
      additionalFilters.push({ shipmentDepartmentId: parseInt(departmentId!) })
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

    const shipments = await prisma.shipment.findMany({
      where,
      // フィルター条件に一致するすべてのデータを取得
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