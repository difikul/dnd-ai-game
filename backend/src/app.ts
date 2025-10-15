import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import testRoutes from './routes/test.routes'
import characterRoutes from './routes/character.routes'

const app = express()

// Security middleware
app.use(helmet())

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}))

// Compression
app.use(compression())

// Request logging
app.use(morgan('dev'))

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  })
})

// API routes
app.use('/api/test', testRoutes)
app.use('/api/characters', characterRoutes)

app.get('/api', (req, res) => {
  res.json({
    message: 'D&D AI Game API',
    version: '1.0.0',
    status: 'ready',
    endpoints: {
      health: '/health',
      test: {
        narrator: 'POST /api/test/narrator',
        connections: 'GET /api/test/connections',
      },
      characters: {
        list: 'GET /api/characters',
        create: 'POST /api/characters',
        get: 'GET /api/characters/:id',
        update: 'PUT /api/characters/:id',
        delete: 'DELETE /api/characters/:id',
        modifyHP: 'POST /api/characters/:id/hp',
        addExperience: 'POST /api/characters/:id/experience'
      },
      game: '/api/game (TODO)',
      narrator: '/api/narrator (TODO)',
      dice: '/api/dice (TODO)',
      saves: '/api/saves (TODO)'
    }
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

export default app
