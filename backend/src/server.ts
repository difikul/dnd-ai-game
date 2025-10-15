import { config } from 'dotenv'
config()

import app from './app'

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`)
  console.log(`📍 Environment: ${process.env.NODE_ENV}`)
  console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('👋 SIGINT signal received: closing HTTP server')
  process.exit(0)
})
