import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role')
    
    if (userRole !== 'MANAGEMENT_USER') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const type = url.searchParams.get('type') // 'shipments', 'items', 'departments'
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const departmentId = url.searchParams.get('departmentId')

    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate + 'T23:59:59.999Z') })
    }

    const departmentFilter = departmentId ? { departmentId } : {}

    let csvData = ''

    switch (type) {
      case 'shipments':
        const shipments = await prisma.shipment.findMany({
          where: {
            ...departmentFilter,
            ...(startDate || endDate ? { createdAt: dateFilter } : {})
          },
          include: {
            item: true,
            sender: {
              select: { name: true, email: true }
            },
            department: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        csvData = 'ID,備品名,カテゴリ,数量,単位,宛先,追跡番号,発送者,部署,登録日,発送日,備考\n'
        csvData += shipments.map(s => [
          s.id,
          s.item?.name || '',
          s.item?.category || '',
          s.quantity,
          s.item?.unit || '',
          s.destination,
          s.trackingNumber || '',
          s.sender?.name || '',
          s.department?.name || '',
          s.createdAt.toLocaleDateString('ja-JP'),
          s.shippedAt ? s.shippedAt.toLocaleDateString('ja-JP') : '',
          s.notes || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n')
        break

      case 'items':
        const items = await prisma.item.findMany({
          where: departmentFilter,
          include: {
            department: true,
            _count: {
              select: { shipments: true }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        csvData = 'ID,備品名,カテゴリ,単位,部署,登録日,発送回数\n'
        csvData += items.map(i => [
          i.id,
          i.name,
          i.category,
          i.unit,
          i.department?.name || '',
          i.createdAt.toLocaleDateString('ja-JP'),
          i._count.shipments
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n')
        break

      case 'departments':
        const departments = await prisma.department.findMany({
          include: {
            _count: {
              select: {
                items: true,
                shipments: {
                  where: startDate || endDate ? { createdAt: dateFilter } : {}
                }
              }
            }
          },
          orderBy: {
            name: 'asc'
          }
        })

        csvData = 'ID,部署名,部署コード,管理部署,備品数,発送数\n'
        csvData += departments.map(d => [
          d.id,
          d.name,
          d.code,
          d.isManagement ? '管理部署' : '一般部署',
          d._count.items,
          d._count.shipments
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n')
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid export type' },
          { status: 400 }
        )
    }

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${type}_report.csv"`
      }
    })
  } catch (error) {
    console.error('Export reports error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}