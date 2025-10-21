import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'

// Test database client
export const prismaTest = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || 'postgresql://test_user:test_pass@localhost:5433/dnd_test'
    }
  }
})

beforeAll(async () => {
  console.log('🧪 Setting up test environment...')
  // Ensure database is clean
  try {
    await prismaTest.$executeRawUnsafe('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')
  } catch (error) {
    console.warn('Warning: Could not reset schema (database might not be running)')
  }
  // Run migrations
  // (migrations will be handled by docker-compose.test.yml)
})

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...')
  await prismaTest.$disconnect()
})

beforeEach(async () => {
  // Clean all tables before each test
  const tables = ['Message', 'GameSession', 'Item', 'Character', 'WorldLocation']
  for (const table of tables) {
    try {
      await prismaTest.$executeRawUnsafe(`TRUNCATE "${table}" CASCADE;`)
    } catch (error) {
      // Table might not exist yet, ignore
    }
  }
})
