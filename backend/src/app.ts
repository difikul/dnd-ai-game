import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import authRoutes from './routes/auth.routes'
import testRoutes from './routes/test.routes'
import characterRoutes from './routes/character.routes'
import gameRoutes from './routes/game.routes'
import diceRoutes from './routes/dice.routes'
import saveRoutes from './routes/save.routes'
import restRoutes from './routes/rest.routes'
import quotaRoutes from './routes/quota.routes'
import adminRoutes from './routes/admin.routes'

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
app.use('/api/auth', authRoutes)
app.use('/api/test', testRoutes)
app.use('/api/characters', characterRoutes)
app.use('/api/game', gameRoutes)
app.use('/api/dice', diceRoutes)
app.use('/api/saves', saveRoutes)
app.use('/api/rest', restRoutes)
app.use('/api', quotaRoutes)
app.use('/api/admin', adminRoutes) // Admin routes (requires auth + admin role)

app.get('/api', (req, res) => {
  res.json({
    message: 'D&D AI Game API',
    version: '1.0.0',
    status: 'ready',
    endpoints: {
      health: '/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me (requires auth)',
        updateGeminiKey: 'PUT /api/auth/gemini-key (requires auth)'
      },
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
      game: {
        start: 'POST /api/game/start',
        action: 'POST /api/game/session/:id/action',
        state: 'GET /api/game/session/:id',
        loadByToken: 'GET /api/game/session/token/:token',
        end: 'POST /api/game/session/:id/end'
      },
      dice: {
        roll: 'POST /api/dice/roll',
        types: 'GET /api/dice/types'
      },
      saves: {
        list: 'GET /api/saves',
        save: 'POST /api/saves/:sessionId',
        loadByToken: 'GET /api/saves/token/:token',
        delete: 'DELETE /api/saves/:sessionId',
        regenerateToken: 'POST /api/saves/:sessionId/regenerate-token'
      },
      rest: {
        longRest: 'POST /api/rest/long-rest/:sessionId (requires auth)',
        shortRest: 'POST /api/rest/short-rest/:sessionId (requires auth)'
      },
      narrator: '/api/narrator (TODO)'
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
