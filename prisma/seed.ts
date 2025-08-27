import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create departments
  const managementDept = await prisma.department.upsert({
    where: { code: 'MGMT' },
    update: {},
    create: {
      name: '本部便管理部門',
      code: 'MGMT',
      isManagement: true
    }
  })

  const itDept = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: {
      name: 'IT部',
      code: 'IT',
      isManagement: false
    }
  })

  const salesDept = await prisma.department.upsert({
    where: { code: 'SALES' },
    update: {},
    create: {
      name: '営業部',
      code: 'SALES',
      isManagement: false
    }
  })

  const hrDept = await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: {
      name: '人事部',
      code: 'HR',
      isManagement: false
    }
  })

  // Create users
  const passwordHash = await bcrypt.hash('password123', 12)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@icube.co.jp' },
    update: {},
    create: {
      email: 'admin@icube.co.jp',
      name: '管理者',
      passwordHash,
      departmentId: managementDept.id,
      role: 'MANAGEMENT_USER',
      authType: 'PASSWORD'
    }
  })

  const itUser = await prisma.user.upsert({
    where: { email: 'it.user@icube.co.jp' },
    update: {},
    create: {
      email: 'it.user@icube.co.jp',
      name: '田中太郎',
      passwordHash,
      departmentId: itDept.id,
      role: 'DEPARTMENT_USER',
      authType: 'PASSWORD'
    }
  })

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales.user@icube.co.jp' },
    update: {},
    create: {
      email: 'sales.user@icube.co.jp',
      name: '佐藤花子',
      passwordHash,
      departmentId: salesDept.id,
      role: 'DEPARTMENT_USER',
      authType: 'PASSWORD'
    }
  })

  // Create sample items
  const officeSupplies = await prisma.item.create({
    data: {
      name: 'オフィス用品セット',
      unit: 'セット',
      departmentId: itDept.id
    }
  })

  const printer = await prisma.item.create({
    data: {
      name: 'プリンター',
      unit: '台',
      departmentId: itDept.id
    }
  })

  const businessCards = await prisma.item.create({
    data: {
      name: '名刺',
      unit: '箱',
      departmentId: salesDept.id
    }
  })

  // Create sample shipments
  await prisma.shipment.create({
    data: {
      itemId: officeSupplies.id,
      quantity: 3,
      senderId: itUser.id,
      departmentId: itDept.id,
      destination: '東京オフィス',
      trackingNumber: '123-456-789',
      notes: '急送',
      shippedAt: new Date('2024-01-15T14:30:00Z')
    }
  })

  await prisma.shipment.create({
    data: {
      itemId: businessCards.id,
      quantity: 2,
      senderId: salesUser.id,
      departmentId: salesDept.id,
      destination: '大阪支社',
      notes: '通常配送'
    }
  })

  console.log('Seeding finished.')
  console.log('Sample users created:')
  console.log('- admin@icube.co.jp (password: password123) - 管理者')
  console.log('- it.user@icube.co.jp (password: password123) - IT部ユーザー')
  console.log('- sales.user@icube.co.jp (password: password123) - 営業部ユーザー')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })