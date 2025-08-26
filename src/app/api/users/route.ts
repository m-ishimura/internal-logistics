import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { userSchema, paginationSchema } from '@/lib/validation'

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
    const queryParams = Object.fromEntries(url.searchParams.entries())
    const { error, value } = paginationSchema.validate(queryParams)
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.details },
        { status: 400 }
      )
    }

    const { page, limit, search, sortBy = 'createdAt', sortOrder } = value
    const skip = (page - 1) * limit

    const where = search 
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } }
          ]
        }
      : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          authType: true,
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
      }),
      prisma.user.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role')
    
    if (userRole !== 'MANAGEMENT_USER') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { error, value } = userSchema.validate(body)
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.details },
        { status: 400 }
      )
    }

    const user = await prisma.user.create({
      data: value,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        authType: true,
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
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create user error:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}