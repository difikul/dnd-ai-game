import { beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { mockCharacter, mockGameSession, mockNarratorMessage } from './fixtures/mockData'

// MSW server pro API mocking
export const server = setupServer(
  // Character endpoints
  http.get('http://localhost:3000/api/characters', () => {
    return HttpResponse.json([mockCharacter])
  }),

  http.get('http://localhost:3000/api/characters/:id', ({ params }) => {
    return HttpResponse.json(mockCharacter)
  }),

  http.post('http://localhost:3000/api/characters', async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      ...mockCharacter,
      ...body,
      id: 'new-char-123',
      hitPoints: 10,
      maxHitPoints: 10,
      armorClass: 12,
      experience: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }),

  http.patch('http://localhost:3000/api/characters/:id', async ({ request, params }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      ...mockCharacter,
      ...body,
      id: params.id,
      updatedAt: new Date().toISOString()
    })
  }),

  http.delete('http://localhost:3000/api/characters/:id', () => {
    return HttpResponse.json({ success: true })
  }),

  // Game session endpoints
  http.post('http://localhost:3000/api/game/start', async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      success: true,
      data: {
        sessionId: 'test-session-123',
        sessionToken: 'gs_test_token',
        narratorMessage: 'Welcome to the adventure!',
        character: {
          id: body.characterId || 'char-123',
          currentLocation: 'Starting Village'
        }
      }
    })
  }),

  http.get('http://localhost:3000/api/game/session/:id', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        session: mockGameSession,
        character: mockCharacter,
        messages: [mockNarratorMessage]
      }
    })
  }),

  http.get('http://localhost:3000/api/game/load/:token', ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        session: mockGameSession,
        character: mockCharacter,
        messages: []
      }
    })
  }),

  http.post('http://localhost:3000/api/game/session/:id/action', async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      success: true,
      data: {
        response: 'The AI narrator responds to your action.',
        metadata: {},
        worldStateChanged: false
      }
    })
  }),

  http.post('http://localhost:3000/api/game/save', () => {
    return HttpResponse.json({
      success: true,
      data: {
        sessionToken: 'gs_saved_token',
        savedAt: new Date(),
        success: true
      }
    })
  }),

  http.post('http://localhost:3000/api/game/session/:id/end', () => {
    return HttpResponse.json({ success: true })
  }),

  http.get('http://localhost:3000/api/game/saves', () => {
    return HttpResponse.json({
      success: true,
      data: []
    })
  }),

  http.delete('http://localhost:3000/api/game/session/:id', () => {
    return HttpResponse.json({ success: true })
  }),

  // Dice roll endpoint
  http.post('http://localhost:3000/api/dice/roll', async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      success: true,
      data: {
        notation: body.notation || '1d20',
        count: 1,
        sides: 20,
        modifier: 0,
        rolls: [15],
        total: 15,
        advantage: body.advantage || false,
        disadvantage: body.disadvantage || false,
        type: body.type
      }
    })
  })
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
