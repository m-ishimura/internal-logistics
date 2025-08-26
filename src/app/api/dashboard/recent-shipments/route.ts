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

    // WHERE条件の構築
    let where: any = {
      shippedAt: {
        gte: dateStart,
        lte: dateEnd
      }
    }

    // 部署フィルター（発送先でフィルター）
    if (userRole === 'DEPARTMENT_USER') {
      // 部署ユーザーは自部署が発送先のもののみ
      where.destination = departmentId
    } else if (filterDepartmentId && filterDepartmentId !== 'all') {
      // 管理者で特定部署が選択された場合、発送先でフィルター
      const selectedDept = await prisma.department.findUnique({
        where: { id: filterDepartmentId },
        select: { name: true }
      })
      if (selectedDept) {
        where.destination = selectedDept.name
      }
    }

    const shipments = await prisma.shipment.findMany({
      where,
      take: 10, // 最新10件
      orderBy: [
        { shippedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        quantity: true,
        destination: true,
        notes: true,
        shippedAt: true,
        createdAt: true,
        trackingNumber: true,
        item: {
          select: {
            id: true,
            name: true,
            category: true,
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
        department: {
          select: {
            id: true,
            name: true,
            code: true
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