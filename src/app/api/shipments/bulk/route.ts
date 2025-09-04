import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import * as Papa from 'papaparse'
import Encoding from 'encoding-japanese'
import { getUserFromHeaders } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get user data from DB using JWT userId in headers
    const user = await getUserFromHeaders(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

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
      let csvContent: string
      
      try {
        // Detect character encoding for CSV files
        const detected = Encoding.detect(buffer)
        
        // Convert to UTF-8 if necessary, with fallback to original UTF-8 parsing
        if (detected && detected !== 'UTF8' && detected !== 'ASCII') {
          const convertedArray = Encoding.convert(buffer, {
            to: 'UNICODE',
            from: detected
          })
          csvContent = Encoding.codeToString(convertedArray)
        } else {
          // Fallback to original UTF-8 parsing for safety
          csvContent = buffer.toString('utf-8')
        }
      } catch (error) {
        // If encoding detection fails, fallback to UTF-8 (existing behavior)
        console.warn('Character encoding detection failed, falling back to UTF-8:', error)
        csvContent = buffer.toString('utf-8')
      }
      
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
        uploadedBy: user.id,
        status: 'PROCESSING'
      }
    })

    // Step 1: Validate all rows first (no database writes)
    const validationErrors: Array<{
      rowNumber: number
      errorMessage: string
      rowData: any
    }> = []
    
    const validatedRows: Array<{
      rowNumber: number
      rowData: any
      parsedData: {
        item: any
        quantity: number
        destinationDepartment: any
        shipmentDepartment: any  // 新しく追加
        shipmentUserId: number | null
        shippedAt: Date | undefined
        trackingNumber: string | undefined
        notes: string | undefined
      }
    }> = []

    // Validate each row without making any changes
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNumber = i + 2 // +2 because of header and 0-based index

      try {
        // Validate required fields
        if (!row.item_name || !row.quantity || !row.destination_department_name) {
          throw new Error('必須項目（item_name, quantity, destination_department_name）が不足しています')
        }

        // Find item by name
        // Department users can only use items from their own department
        // Management users can use items from any department
        const item = await prisma.item.findFirst({
          where: {
            name: row.item_name.toString().trim(),
            ...(user.role === 'DEPARTMENT_USER' && { departmentId: user.departmentId })
          }
        })

        if (!item) {
          throw new Error(`備品「${row.item_name}」が見つかりません`)
        }

        const quantity = parseInt(row.quantity)
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error('数量は正の整数で入力してください')
        }

        // Find destination department by name
        const destinationDepartment = await prisma.department.findFirst({
          where: {
            name: row.destination_department_name.toString().trim()
          }
        })

        if (!destinationDepartment) {
          throw new Error(`宛先部署「${row.destination_department_name}」が見つかりません`)
        }

        // Find shipment department by name (新機能 - MANAGEMENT_USERのみ)
        let shipmentDepartment = null
        if (row.shipment_department_name && row.shipment_department_name.toString().trim()) {
          // MANAGEMENT_USERのみ発送元部署を指定可能
          if (user.role !== 'MANAGEMENT_USER') {
            throw new Error('一般ユーザーは発送元部署を指定できません')
          }
          
          shipmentDepartment = await prisma.department.findFirst({
            where: {
              name: row.shipment_department_name.toString().trim()
            }
          })

          if (!shipmentDepartment) {
            throw new Error(`発送元部署「${row.shipment_department_name}」が見つかりません`)
          }
        } else {
          // 従来通りの動作：ログインユーザーの部署を使用
          shipmentDepartment = await prisma.department.findFirst({
            where: {
              id: user.departmentId
            }
          })
        }

        // Find shipment user by name if provided
        let shipmentUserId: number | null = null
        if (row.shipment_user_name && row.shipment_user_name.toString().trim()) {
          const shipmentUser = await prisma.user.findFirst({
            where: {
              name: row.shipment_user_name.toString().trim(),
              departmentId: destinationDepartment.id
            }
          })

          if (shipmentUser) {
            shipmentUserId = shipmentUser.id
          } else {
            throw new Error(`発送先部署「${destinationDepartment.name}」にユーザー「${row.shipment_user_name}」が見つかりません`)
          }
        }

        // Parse shipped date if provided
        let shippedAt: Date | undefined
        if (row.shipped_at && row.shipped_at.toString().trim()) {
          shippedAt = new Date(row.shipped_at.toString().trim())
          if (isNaN(shippedAt.getTime())) {
            throw new Error('発送日時の形式が正しくありません')
          }
        }

        // Store validated data for transaction processing
        validatedRows.push({
          rowNumber,
          rowData: row,
          parsedData: {
            item,
            quantity,
            destinationDepartment,
            shipmentDepartment,  // 新しく追加
            shipmentUserId,
            shippedAt,
            trackingNumber: row.tracking_number ? row.tracking_number.toString().trim() : undefined,
            notes: row.notes ? row.notes.toString().trim() : undefined
          }
        })
      } catch (error: any) {
        validationErrors.push({
          rowNumber,
          errorMessage: error.message,
          rowData: row
        })
      }
    }

    let successCount = 0
    void validationErrors.length // Error count tracked for validation

    // If there are any validation errors, return them without processing any rows
    if (validationErrors.length > 0) {
      // Save errors to database
      await prisma.bulkImportError.createMany({
        data: validationErrors.map(error => ({
          bulkImportId: bulkImport.id,
          rowNumber: error.rowNumber,
          errorMessage: error.errorMessage,
          rowData: error.rowData
        }))
      })

      // Update bulk import status to FAILED
      await prisma.bulkImport.update({
        where: { id: bulkImport.id },
        data: {
          successRecords: 0,
          errorRecords: validationErrors.length,
          status: 'FAILED'
        }
      })

      const updatedBulkImport = await prisma.bulkImport.findUnique({
        where: { id: bulkImport.id }
      })

      return NextResponse.json({
        success: true,
        data: updatedBulkImport
      })
    }

    // Step 2: If validation passed, process all rows in a transaction
    try {
      await prisma.$transaction(async (tx) => {
        for (const validatedRow of validatedRows) {
          const { parsedData } = validatedRow
          
          await tx.shipment.create({
            data: {
              itemId: parsedData.item.id,
              quantity: parsedData.quantity,
              senderId: user.id,
              // 新機能：MANAGEMENT_USERが指定した場合はその部署、そうでなければユーザーの部署
              shipmentDepartmentId: parsedData.shipmentDepartment.id,
              destinationDepartmentId: parsedData.destinationDepartment.id,
              shipmentUserId: parsedData.shipmentUserId,
              trackingNumber: parsedData.trackingNumber,
              notes: parsedData.notes,
              shippedAt: parsedData.shippedAt,
              createdBy: user.id,
              updatedBy: user.id
            }
          })
          
          successCount++
        }
      })
    } catch (transactionError: any) {
      // Transaction failed, update bulk import status
      await prisma.bulkImport.update({
        where: { id: bulkImport.id },
        data: {
          successRecords: 0,
          errorRecords: data.length,
          status: 'FAILED'
        }
      })

      return NextResponse.json(
        { success: false, error: `トランザクションエラー: ${transactionError.message}` },
        { status: 500 }
      )
    }

    // Update bulk import status to COMPLETED (all records processed successfully)
    await prisma.bulkImport.update({
      where: { id: bulkImport.id },
      data: {
        successRecords: successCount,
        errorRecords: 0,
        status: 'COMPLETED'
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