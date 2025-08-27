import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { itemSchema } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userRole = request.headers.get('x-user-role')
    const departmentId = request.headers.get('x-department-id')

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        department: true,
        _count: {
          select: { shipments: true }
        }
      }
    })

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      )
    }

    // Department users can only view their own department's items
    if (userRole === 'DEPARTMENT_USER' && item.departmentId !== parseInt(departmentId || '0')) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: item
    })
  } catch (error) {
    console.error('Get item error:', error)
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
    const { id } = await params
    const userRole = request.headers.get('x-user-role')
    const departmentId = request.headers.get('x-department-id')

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id }
    })

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      )
    }

    // Department users can only edit their own department's items
    if (userRole === 'DEPARTMENT_USER' && existingItem.departmentId !== parseInt(departmentId || '0')) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { error, value } = itemSchema.validate(body)
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.details },
        { status: 400 }
      )
    }

    // Department users can only assign items to their own department
    if (userRole === 'DEPARTMENT_USER' && value.departmentId !== parseInt(departmentId || '0')) {
      return NextResponse.json(
        { success: false, error: 'Access denied - can only assign items to your department' },
        { status: 403 }
      )
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: value,
      include: {
        department: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedItem
    })
  } catch (error) {
    console.error('Update item error:', error)
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
    const { id } = await params
    const userRole = request.headers.get('x-user-role')
    const departmentId = request.headers.get('x-department-id')

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id },
      include: {
        _count: {
          select: { shipments: true }
        }
      }
    })

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      )
    }

    // Department users can only delete their own department's items
    if (userRole === 'DEPARTMENT_USER' && existingItem.departmentId !== parseInt(departmentId || '0')) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if item has shipments
    if (existingItem._count.shipments > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete item with existing shipments' },
        { status: 400 }
      )
    }

    await prisma.item.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully'
    })
  } catch (error) {
    console.error('Delete item error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}