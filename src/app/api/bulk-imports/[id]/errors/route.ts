import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const bulkImportId = resolvedParams.id
    
    // Verify the bulk import belongs to the user or user is management
    const userId = request.headers.get('x-user-id')!
    const userRole = request.headers.get('x-user-role')
    
    const bulkImport = await prisma.bulkImport.findUnique({
      where: { id: bulkImportId }
    })

    if (!bulkImport) {
      return NextResponse.json(
        { success: false, error: 'Bulk import not found' },
        { status: 404 }
      )
    }

    // Check access rights
    if (userRole !== 'MANAGEMENT_USER' && bulkImport.uploadedBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const errors = await prisma.bulkImportError.findMany({
      where: { bulkImportId },
      orderBy: { rowNumber: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: errors
    })
  } catch (error) {
    console.error('Get bulk import errors error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}