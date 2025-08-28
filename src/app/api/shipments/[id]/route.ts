import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { shipmentSchema } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    const departmentId = request.headers.get('x-department-id')
    const resolvedParams = await params
    const shipmentId = resolvedParams.id

    if (!shipmentId) {
      return NextResponse.json(
        { success: false, error: 'Shipment ID is required' },
        { status: 400 }
      )
    }

    const where: Record<string, any> = { id: shipmentId }

    // Department users can only access their own department's shipments
    if (userRole === 'DEPARTMENT_USER') {
      where.shipmentDepartmentId = parseInt(departmentId!)
    }

    const shipment = await prisma.shipment.findFirst({
      where,
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

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: shipment
    })
  } catch (error) {
    console.error('Get shipment error:', error)
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
    const userId = request.headers.get('x-user-id')!
    const userRole = request.headers.get('x-user-role')
    const departmentId = request.headers.get('x-department-id')!
    const resolvedParams = await params
    const shipmentId = resolvedParams.id

    if (!shipmentId) {
      return NextResponse.json(
        { success: false, error: 'Shipment ID is required' },
        { status: 400 }
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

    // Check if shipment exists and user has access
    const where: Record<string, any> = { id: shipmentId }
    if (userRole === 'DEPARTMENT_USER') {
      where.shipmentDepartmentId = parseInt(departmentId!)
    }

    const existingShipment = await prisma.shipment.findFirst({
      where,
      include: { item: true }
    })

    if (!existingShipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found or access denied' },
        { status: 404 }
      )
    }

    // Verify the new item belongs to the user's department (for department users)
    if (userRole === 'DEPARTMENT_USER' && value.itemId !== existingShipment.itemId) {
      const item = await prisma.item.findUnique({
        where: { id: value.itemId }
      })

      if (!item || item.departmentId !== parseInt(departmentId!)) {
        return NextResponse.json(
          { success: false, error: 'Item not found or access denied' },
          { status: 403 }
        )
      }
    }

    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        ...value,
        updatedBy: parseInt(userId!)
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
      data: updatedShipment
    })
  } catch (error) {
    console.error('Update shipment error:', error)
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
    // const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    const departmentId = request.headers.get('x-department-id')
    const resolvedParams = await params
    const shipmentId = resolvedParams.id

    if (!shipmentId) {
      return NextResponse.json(
        { success: false, error: 'Shipment ID is required' },
        { status: 400 }
      )
    }

    // Check if shipment exists and user has access
    const where: Record<string, any> = { id: shipmentId }
    if (userRole === 'DEPARTMENT_USER') {
      where.shipmentDepartmentId = parseInt(departmentId!)
    }

    const existingShipment = await prisma.shipment.findFirst({
      where
    })

    if (!existingShipment) {
      return NextResponse.json(
        { success: false, error: 'Shipment not found or access denied' },
        { status: 404 }
      )
    }

    await prisma.shipment.delete({
      where: { id: shipmentId }
    })

    return NextResponse.json({
      success: true,
      message: 'Shipment deleted successfully'
    })
  } catch (error) {
    console.error('Delete shipment error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}