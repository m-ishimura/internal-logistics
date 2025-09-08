const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function deployMigrations() {
  try {
    console.log('🚀 Running Prisma migrations...');
    
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated');
    
    // Deploy migrations
    console.log('🔄 Deploying migrations...');
    await execAsync('npx prisma migrate deploy');
    console.log('✅ Migrations deployed successfully');
    
    // Verify indexes exist
    console.log('🔍 Verifying indexes...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const result = await prisma.$queryRaw`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'shipments' 
      AND schemaname = 'public' 
      AND indexname LIKE 'idx_shipments_%'
      ORDER BY indexname;
    `;
    
    console.log('📊 Current shipments indexes:', result);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  deployMigrations();
}

module.exports = { deployMigrations };