/**
 * Unit Tests for API Service
 * Tests axios instance, interceptors, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { api, getErrorMessage } from '@/services/api.service'
import { server } from '../../setup'
import { http, HttpResponse } from 'msw'
import axios, { AxiosError } from 'axios'

describe('API Service', () => {
  beforeEach(() => {
    server.resetHandlers()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Axios Instance Configuration', () => {
    it('should have correct baseURL', () => {
      expect(api.defaults.baseURL).toBeDefined()
      expect(api.defaults.baseURL).toContain('localhost')
    })

    it('should have correct timeout', () => {
      expect(api.defaults.timeout).toBe(30000)
    })

    it('should have correct default headers', () => {
      expect(api.defaults.headers['Content-Type']).toBe('application/json')
    })
  })

  describe('Request Interceptor - Auth Token', () => {
    it('should add Authorization header when token exists', async () => {
      localStorage.setItem('auth_token', 'test-token-123')

      server.use(
        http.get('http://localhost:3000/api/test', ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          return HttpResponse.json({
            hasAuth: !!authHeader,
            authValue: authHeader
          })
        })
      )

      const response = await api.get('/api/test')

      expect(response.data.hasAuth).toBe(true)
      expect(response.data.authValue).toBe('Bearer test-token-123')
    })

    it('should not add Authorization header when token does not exist', async () => {
      server.use(
        http.get('http://localhost:3000/api/test', ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          return HttpResponse.json({
            hasAuth: !!authHeader
          })
        })
      )

      const response = await api.get('/api/test')

      expect(response.data.hasAuth).toBe(false)
    })

    it('should update Authorization header when token changes', async () => {
      localStorage.setItem('auth_token', 'old-token')

      server.use(
        http.get('http://localhost:3000/api/test', ({ request }) => {
          const authHeader = request.headers.get('Authorization')
          return HttpResponse.json({
            authValue: authHeader
          })
        })
      )

      await api.get('/api/test')

      localStorage.setItem('auth_token', 'new-token')

      const response = await api.get('/api/test')

      expect(response.data.authValue).toBe('Bearer new-token')
    })
  })

  describe('Response Interceptor - Status Codes', () => {
    it('should handle 200 OK responses', async () => {
      server.use(
        http.get('http://localhost:3000/api/test', () => {
          return HttpResponse.json({ message: 'Success' }, { status: 200 })
        })
      )

      const response = await api.get('/api/test')

      expect(response.status).toBe(200)
      expect(response.data.message).toBe('Success')
    })

    it('should handle 201 Created responses', async () => {
      server.use(
        http.post('http://localhost:3000/api/test', () => {
          return HttpResponse.json({ id: '123' }, { status: 201 })
        })
      )

      const response = await api.post('/api/test', {})

      expect(response.status).toBe(201)
      expect(response.data.id).toBe('123')
    })

    it('should handle 401 Unauthorized and clear token', async () => {
      localStorage.setItem('auth_token', 'expired-token')

      server.use(
        http.get('http://localhost:3000/api/test', () => {
          return HttpResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          )
        })
      )

      try {
        await api.get('/api/test')
      } catch (error) {
        expect((error as AxiosError).response?.status).toBe(401)
      }

      // Token should be cleared
      expect(localStorage.getItem('auth_token')).toBeNull()
    })

    it('should handle 403 Forbidden', async () => {
      server.use(
        http.get('http://localhost:3000/api/test', () => {
          return HttpResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
          )
        })
      )

      await expect(api.get('/api/test')).rejects.toThrow()
    })

    it('should handle 404 Not Found', async () => {
      server.use(
        http.get('http://localhost:3000/api/test', () => {
          return HttpResponse.json(
            { error: 'Not Found' },
            { status: 404 }
          )
        })
      )

      try {
        await api.get('/api/test')
      } catch (error) {
        expect((error as AxiosError).response?.status).toBe(404)
      }
    })

    it('should handle 500 Internal Server Error', async () => {
      server.use(
        http.get('http://localhost:3000/api/test', () => {
          return HttpResponse.json(
            { error: 'Server Error' },
            { status: 500 }
          )
        })
      )

      try {
        await api.get('/api/test')
      } catch (error) {
        expect((error as AxiosError).response?.status).toBe(500)
      }
    })
  })

  describe('HTTP Methods', () => {
    it('should perform GET request', async () => {
      server.use(
        http.get('http://localhost:3000/api/items', () => {
          return HttpResponse.json({ items: ['item1', 'item2'] })
        })
      )

      const response = await api.get('/api/items')

      expect(response.data.items).toEqual(['item1', 'item2'])
    })

    it('should perform POST request', async () => {
      server.use(
        http.post('http://localhost:3000/api/items', async ({ request }) => {
          const body = await request.json() as any
          return HttpResponse.json({
            id: '123',
            ...body
          }, { status: 201 })
        })
      )

      const response = await api.post('/api/items', { name: 'New Item' })

      expect(response.status).toBe(201)
      expect(response.data.name).toBe('New Item')
      expect(response.data.id).toBe('123')
    })

    it('should perform PUT request', async () => {
      server.use(
        http.put('http://localhost:3000/api/items/:id', async ({ request, params }) => {
          const body = await request.json() as any
          return HttpResponse.json({
            id: params.id,
            ...body
          })
        })
      )

      const response = await api.put('/api/items/123', { name: 'Updated Item' })

      expect(response.data.id).toBe('123')
      expect(response.data.name).toBe('Updated Item')
    })

    it('should perform PATCH request', async () => {
      server.use(
        http.patch('http://localhost:3000/api/items/:id', async ({ request, params }) => {
          const body = await request.json() as any
          return HttpResponse.json({
            id: params.id,
            ...body
          })
        })
      )

      const response = await api.patch('/api/items/123', { status: 'active' })

      expect(response.data.id).toBe('123')
      expect(response.data.status).toBe('active')
    })

    it('should perform DELETE request', async () => {
      server.use(
        http.delete('http://localhost:3000/api/items/:id', () => {
          return HttpResponse.json({ success: true })
        })
      )

      const response = await api.delete('/api/items/123')

      expect(response.data.success).toBe(true)
    })
  })

  describe('Request/Response Formats', () => {
    it('should send JSON request body', async () => {
      let receivedBody: any = null

      server.use(
        http.post('http://localhost:3000/api/test', async ({ request }) => {
          receivedBody = await request.json()
          return HttpResponse.json({ success: true })
        })
      )

      await api.post('/api/test', { key: 'value', nested: { data: 'test' } })

      expect(receivedBody).toEqual({ key: 'value', nested: { data: 'test' } })
    })

    it('should receive JSON response', async () => {
      server.use(
        http.get('http://localhost:3000/api/test', () => {
          return HttpResponse.json({
            string: 'text',
            number: 123,
            boolean: true,
            array: [1, 2, 3],
            object: { nested: 'value' }
          })
        })
      )

      const response = await api.get('/api/test')

      expect(response.data.string).toBe('text')
      expect(response.data.number).toBe(123)
      expect(response.data.boolean).toBe(true)
      expect(response.data.array).toEqual([1, 2, 3])
      expect(response.data.object).toEqual({ nested: 'value' })
    })

    it('should handle empty response body', async () => {
      server.use(
        http.delete('http://localhost:3000/api/test', () => {
          return new HttpResponse(null, { status: 204 })
        })
      )

      const response = await api.delete('/api/test')

      expect(response.status).toBe(204)
      expect(response.data).toBeNull()
    })

    it('should send custom headers', async () => {
      let receivedHeaders: Record<string, string> = {}

      server.use(
        http.get('http://localhost:3000/api/test', ({ request }) => {
          receivedHeaders = {
            'x-custom': request.headers.get('x-custom') || '',
            'accept-language': request.headers.get('accept-language') || ''
          }
          return HttpResponse.json({ success: true })
        })
      )

      await api.get('/api/test', {
        headers: {
          'X-Custom': 'custom-value',
          'Accept-Language': 'cs-CZ'
        }
      })

      expect(receivedHeaders['x-custom']).toBe('custom-value')
      expect(receivedHeaders['accept-language']).toBe('cs-CZ')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      server.use(
        http.get('http://localhost:3000/api/test', () => {
          return HttpResponse.error()
        })
      )

      await expect(api.get('/api/test')).rejects.toThrow()
    })

    it('should handle timeout', async () => {
      server.use(
        http.get('http://localhost:3000/api/test', async () => {
          await new Promise(resolve => setTimeout(resolve, 35000))
          return HttpResponse.json({ success: true })
        })
      )

      await expect(api.get('/api/test')).rejects.toThrow()
    }, 40000)

    it('should handle malformed JSON response', async () => {
      server.use(
        http.get('http://localhost:3000/api/test', () => {
          return new HttpResponse('not json', {
            headers: { 'Content-Type': 'application/json' }
          })
        })
      )

      await expect(api.get('/api/test')).rejects.toThrow()
    })

    it('should reject on 4xx client errors', async () => {
      server.use(
        http.post('http://localhost:3000/api/test', () => {
          return HttpResponse.json(
            { error: 'Bad Request' },
            { status: 400 }
          )
        })
      )

      await expect(api.post('/api/test', {})).rejects.toThrow()
    })

    it('should reject on 5xx server errors', async () => {
      server.use(
        http.get('http://localhost:3000/api/test', () => {
          return HttpResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
          )
        })
      )

      await expect(api.get('/api/test')).rejects.toThrow()
    })
  })

  describe('getErrorMessage Utility', () => {
    it('should extract message from axios error response', () => {
      const axiosError = {
        response: {
          data: {
            message: 'Custom error message'
          }
        },
        isAxiosError: true
      } as AxiosError<{ message: string }>

      const message = getErrorMessage(axiosError)

      expect(message).toBe('Custom error message')
    })

    it('should extract error field from axios error response', () => {
      const axiosError = {
        response: {
          data: {
            error: 'Error field message'
          }
        },
        isAxiosError: true
      } as AxiosError<{ error: string }>

      const message = getErrorMessage(axiosError)

      expect(message).toBe('Error field message')
    })

    it('should return axios error message if no response data', () => {
      const axiosError = {
        message: 'Network Error',
        isAxiosError: true
      } as AxiosError

      const message = getErrorMessage(axiosError)

      expect(message).toBe('Network Error')
    })

    it('should return default message when response has no message/error', () => {
      const axiosError = {
        response: {
          data: {}
        },
        isAxiosError: true
      } as AxiosError

      const message = getErrorMessage(axiosError)

      expect(message).toBe('Nastala chyba při komunikaci se serverem')
    })

    it('should handle standard Error objects', () => {
      const error = new Error('Standard error message')

      const message = getErrorMessage(error)

      expect(message).toBe('Standard error message')
    })

    it('should handle unknown error types', () => {
      const message = getErrorMessage('string error')

      expect(message).toBe('Neznámá chyba')
    })

    it('should handle null or undefined errors', () => {
      expect(getErrorMessage(null)).toBe('Neznámá chyba')
      expect(getErrorMessage(undefined)).toBe('Neznámá chyba')
    })

    it('should prioritize message over error field', () => {
      const axiosError = {
        response: {
          data: {
            message: 'Message field',
            error: 'Error field'
          }
        },
        isAxiosError: true
      } as AxiosError<{ message: string; error: string }>

      const message = getErrorMessage(axiosError)

      expect(message).toBe('Message field')
    })
  })

  describe('Query Parameters', () => {
    it('should send query parameters correctly', async () => {
      let receivedParams: URLSearchParams | null = null

      server.use(
        http.get('http://localhost:3000/api/test', ({ request }) => {
          receivedParams = new URL(request.url).searchParams
          return HttpResponse.json({ success: true })
        })
      )

      await api.get('/api/test', {
        params: {
          page: 1,
          limit: 10,
          search: 'test query'
        }
      })

      expect(receivedParams?.get('page')).toBe('1')
      expect(receivedParams?.get('limit')).toBe('10')
      expect(receivedParams?.get('search')).toBe('test query')
    })

    it('should handle array query parameters', async () => {
      let receivedParams: URLSearchParams | null = null

      server.use(
        http.get('http://localhost:3000/api/test', ({ request }) => {
          receivedParams = new URL(request.url).searchParams
          return HttpResponse.json({ success: true })
        })
      )

      await api.get('/api/test', {
        params: {
          ids: [1, 2, 3]
        }
      })

      expect(receivedParams?.toString()).toContain('ids')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large request payload', async () => {
      const largeData = {
        data: 'A'.repeat(100000)
      }

      server.use(
        http.post('http://localhost:3000/api/test', async ({ request }) => {
          const body = await request.json() as any
          return HttpResponse.json({ length: body.data.length })
        })
      )

      const response = await api.post('/api/test', largeData)

      expect(response.data.length).toBe(100000)
    })

    it('should handle special characters in URLs', async () => {
      server.use(
        http.get('http://localhost:3000/api/test/:id', ({ params }) => {
          return HttpResponse.json({ id: params.id })
        })
      )

      const response = await api.get('/api/test/special%20chars%20%26%20symbols')

      expect(response.data.id).toBeTruthy()
    })

    it('should handle concurrent requests', async () => {
      server.use(
        http.get('http://localhost:3000/api/test/:id', ({ params }) => {
          return HttpResponse.json({ id: params.id })
        })
      )

      const promises = [
        api.get('/api/test/1'),
        api.get('/api/test/2'),
        api.get('/api/test/3'),
        api.get('/api/test/4'),
        api.get('/api/test/5')
      ]

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      expect(results[0].data.id).toBe('1')
      expect(results[4].data.id).toBe('5')
    })

    it('should handle empty string values', async () => {
      server.use(
        http.post('http://localhost:3000/api/test', async ({ request }) => {
          const body = await request.json() as any
          return HttpResponse.json(body)
        })
      )

      const response = await api.post('/api/test', { name: '', value: '' })

      expect(response.data.name).toBe('')
      expect(response.data.value).toBe('')
    })

    it('should handle null values in request', async () => {
      server.use(
        http.post('http://localhost:3000/api/test', async ({ request }) => {
          const body = await request.json() as any
          return HttpResponse.json(body)
        })
      )

      const response = await api.post('/api/test', { field: null })

      expect(response.data.field).toBeNull()
    })
  })
})
