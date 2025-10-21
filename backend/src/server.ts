import { config } from 'dotenv'
config()

import app from './app'
import { disconnectDatabase } from './config/database'

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`)
  console.log(`📍 Environment: ${process.env.NODE_ENV}`)
  console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN}`)
})

/**
 * Graceful shutdown handler
 * Properly closes database connections and HTTP server before exiting
 */
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n👋 ${signal} signal received: starting graceful shutdown`)

  // Close HTTP server first (stop accepting new connections)
  server.close(async () => {
    console.log('✅ HTTP server closed')

    try {
      // Close database connections
      await disconnectDatabase()
      console.log('✅ Database connections closed')

      console.log('✅ Graceful shutdown completed')
      process.exit(0)
    } catch (error) {
      console.error('❌ Error during shutdown:', error)
      process.exit(1)
    }
  })

  // Force shutdown after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('⚠️  Graceful shutdown timeout, forcing exit')
    process.exit(1)
  }, 10000)
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  gracefulShutdown('UNHANDLED_REJECTION')
})

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  gracefulShutdown('UNCAUGHT_EXCEPTION')
})
