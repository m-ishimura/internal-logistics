import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import * as Papa from 'papaparse'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!
    const departmentId = request.headers.get('x-department-id')!

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'ファイルが選択されていません' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let data: any[] = []

    // Parse file based on type
    if (file.name.endsWith('.csv')) {
      const csvContent = buffer.toString('utf-8')
      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true
      })
      data = parseResult.data as any[]
    } else if (file.name.match(/\.xlsx?$/)) {
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      data = XLSX.utils.sheet_to_json(worksheet)
    } else {
      return NextResponse.json(
        { success: false, error: 'サポートされていないファイル形式です' },
        { status: 400 }
      )
    }

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ファイルにデータが含まれていません' },
        { status: 400 }
      )
    }

    // Create bulk import record
    const bulkImport = await prisma.bulkImport.create({
      data: {
        fileName: file.name,
        totalRecords: data.length,
        successRecords: 0,
        errorRecords: 0,
        uploadedBy: userId,
        status: 'PROCESSING'
      }
    })

    let successCount = 0
    let errorCount = 0
    const errors: Array<{
      rowNumber: number
      errorMessage: string
      rowData: any
    }> = []

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNumber = i + 2 // +2 because of header and 0-based index

      try {
        // Validate required fields
        if (!row.item_name || !row.quantity || !row.destination) {
          throw new Error('必須項目（item_name, quantity, destination）が不足しています')
        }

        // Find item by name
        const item = await prisma.item.findFirst({
          where: {
            name: row.item_name.toString().trim(),
            departmentId: departmentId // Only items from user's department
          }
        })

        if (!item) {
          throw new Error(`備品「${row.item_name}」が見つかりません`)
        }

        const quantity = parseInt(row.quantity)
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error('数量は正の整数で入力してください')
        }

        // Parse shipped date if provided
        let shippedAt: Date | undefined
        if (row.shipped_at && row.shipped_at.toString().trim()) {
          shippedAt = new Date(row.shipped_at.toString().trim())
          if (isNaN(shippedAt.getTime())) {
            throw new Error('発送日時の形式が正しくありません')
          }
        }

        // Create shipment
        await prisma.shipment.create({
          data: {
            itemId: item.id,
            quantity: quantity,
            senderId: userId,
            departmentId: departmentId,
            destination: row.destination.toString().trim(),
            trackingNumber: row.tracking_number ? row.tracking_number.toString().trim() : undefined,
            notes: row.notes ? row.notes.toString().trim() : undefined,
            shippedAt: shippedAt
          }
        })

        successCount++
      } catch (error: any) {
        errorCount++
        errors.push({
          rowNumber,
          errorMessage: error.message,
          rowData: row
        })
      }
    }

    // Save errors to database
    if (errors.length > 0) {
      await prisma.bulkImportError.createMany({
        data: errors.map(error => ({
          bulkImportId: bulkImport.id,
          rowNumber: error.rowNumber,
          errorMessage: error.errorMessage,
          rowData: error.rowData
        }))
      })
    }

    // Update bulk import status
    await prisma.bulkImport.update({
      where: { id: bulkImport.id },
      data: {
        successRecords: successCount,
        errorRecords: errorCount,
        status: errorCount === 0 ? 'COMPLETED' : errorCount === data.length ? 'FAILED' : 'COMPLETED'
      }
    })

    const updatedBulkImport = await prisma.bulkImport.findUnique({
      where: { id: bulkImport.id }
    })

    return NextResponse.json({
      success: true,
      data: updatedBulkImport
    })
  } catch (error: any) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}