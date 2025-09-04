import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromHeaders } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    // Get user data from DB using JWT userId in headers
    const user = await getUserFromHeaders(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const departmentId = parseInt(resolvedParams.departmentId)

    if (isNaN(departmentId) || departmentId < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid department ID' },
        { status: 400 }
      )
    }

    const users = await prisma.user.findMany({
      where: {
        departmentId: departmentId
      },
      select: {
        id: true,
        name: true,
        email: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: users
    })
  } catch (error) {
    console.error('Get users by department error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}