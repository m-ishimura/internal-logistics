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
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const departmentId = url.searchParams.get('departmentId')

    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate + 'T23:59:59.999Z') })
    }

    const departmentFilter = departmentId ? { departmentId } : {}

    // Get total statistics
    const [totalShipments, totalItems] = await Promise.all([
      prisma.shipment.count({
        where: {
          ...departmentFilter,
          ...(startDate || endDate ? { createdAt: dateFilter } : {})
        }
      }),
      prisma.item.count({
        where: departmentFilter
      })
    ])

    // Get department statistics
    const departmentStats = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
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

    // Get last shipment date for each department
    const departmentLastShipments = await Promise.all(
      departmentStats.map(async (dept) => {
        const lastShipment = await prisma.shipment.findFirst({
          where: {
            departmentId: dept.id,
            ...(startDate || endDate ? { createdAt: dateFilter } : {})
          },
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            createdAt: true
          }
        })

        return {
          ...dept,
          itemCount: dept._count.items,
          shipmentCount: dept._count.shipments,
          lastShipment: lastShipment?.createdAt
        }
      })
    )

    // Get recent shipments
    const recentShipments = await prisma.shipment.findMany({
      where: {
        ...departmentFilter,
        ...(startDate || endDate ? { createdAt: dateFilter } : {})
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        item: true,
        sender: {
          select: { id: true, name: true, email: true }
        },
        department: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        totalShipments,
        totalItems,
        departmentStats: departmentLastShipments,
        recentShipments
      }
    })
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}