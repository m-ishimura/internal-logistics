import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { userSchema } from '@/lib/validation'
import bcrypt from 'bcryptjs'

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
    const userId = parseInt(resolvedParams.id)

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        departmentId: true,
        role: true,
        authType: true,
        entraId: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Get user error:', error)
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
    const userId = parseInt(resolvedParams.id)

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // パスワードが空の場合は更新対象から除外
    const validationData = { ...body }
    if (!validationData.password) {
      delete validationData.password
    }

    const { error, value } = userSchema.validate(validationData)
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.details },
        { status: 400 }
      )
    }

    // 更新データの準備
    const updateData: any = {
      name: value.name,
      email: value.email,
      departmentId: value.departmentId,
      role: value.role,
      authType: value.authType
    }

    // パスワードがある場合のみハッシュ化して追加
    if (value.password) {
      updateData.passwordHash = await bcrypt.hash(value.password, 12)
    }

    // Entra IDがある場合のみ追加
    if (value.entraId) {
      updateData.entraId = value.entraId
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        departmentId: true,
        role: true,
        authType: true,
        entraId: true,
        createdAt: true,
        updatedAt: true,
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
      data: user
    })
  } catch (error: any) {
    console.error('Update user error:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      )
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'User not found' },
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
    const userId = parseInt(resolvedParams.id)

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete user error:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}