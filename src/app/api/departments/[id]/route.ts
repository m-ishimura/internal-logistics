import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { departmentSchema } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = request.headers.get('x-user-role')
    
    if (userRole !== 'MANAGEMENT_USER') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const departmentId = parseInt(resolvedParams.id)

    if (isNaN(departmentId) || departmentId < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid department ID' },
        { status: 400 }
      )
    }

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
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

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: department
    })
  } catch (error) {
    console.error('Get department error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = request.headers.get('x-user-role')
    
    if (userRole !== 'MANAGEMENT_USER') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    console.log('PUT Department ID param:', resolvedParams.id)
    const departmentId = parseInt(resolvedParams.id)
    console.log('PUT Parsed department ID:', departmentId)

    if (isNaN(departmentId) || departmentId < 0) {
      console.log('PUT Invalid department ID - returning 400')
      return NextResponse.json(
        { success: false, error: 'Invalid department ID' },
        { status: 400 }
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

    const department = await prisma.department.update({
      where: { id: departmentId },
      data: value
    })

    return NextResponse.json({
      success: true,
      data: department
    })
  } catch (error: any) {
    console.error('Update department error:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Department code already exists' },
        { status: 409 }
      )
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userRole = request.headers.get('x-user-role')
    
    if (userRole !== 'MANAGEMENT_USER') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const departmentId = parseInt(resolvedParams.id)

    if (isNaN(departmentId) || departmentId < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid department ID' },
        { status: 400 }
      )
    }

    // 関連データの存在チェック
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
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

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      )
    }

    // 関連データがある場合は削除を拒否
    if (department._count.users > 0 || 
        department._count.items > 0 || 
        department._count.shipmentDepartments > 0 ||
        department._count.destinationShipments > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete department with related data (users, items, or shipments)' },
        { status: 409 }
      )
    }

    await prisma.department.delete({
      where: { id: departmentId }
    })

    return NextResponse.json({
      success: true,
      message: 'Department deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete department error:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}