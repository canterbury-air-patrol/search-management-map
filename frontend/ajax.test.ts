import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'

vi.mock('./cookies', () => ({
  cookieJar: { get: vi.fn(() => 'test-token') },
  PREFERENCE_COOKIE_OPTS: {}
}))

import { cookieJar } from './cookies'
import { smmGet, smmGetJSON, smmPost, smmPatch, smmDelete } from './ajax'

interface ResponseInit {
  ok: boolean
  status?: number
  json?: unknown
  text?: string
}

function mockResponse({ ok, status, json, text }: ResponseInit): Response {
  return {
    ok,
    status: status ?? (ok ? 200 : 500),
    json: async () => json,
    text: async () => text ?? ''
  } as unknown as Response
}

const fetchMock = vi.fn()

function lastCall() {
  return fetchMock.mock.calls[fetchMock.mock.calls.length - 1]
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  ;(cookieJar.get as Mock).mockReturnValue('test-token')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('smmGetJSON / smmGet', () => {
  it('appends a query string and parses JSON, invoking success', async () => {
    fetchMock.mockResolvedValue(mockResponse({ ok: true, json: { hello: 'world' } }))
    const success = vi.fn()

    const data = await smmGetJSON<{ hello: string }>('/api/thing/', { a: 1, b: 'x' }, success)

    const [url, options] = lastCall()
    expect(url).toBe('/api/thing/?a=1&b=x')
    expect(options.headers).toMatchObject({ Accept: 'application/json' })
    expect(data).toEqual({ hello: 'world' })
    expect(success).toHaveBeenCalledWith({ hello: 'world' })
  })

  it('omits null and undefined query parameters', async () => {
    fetchMock.mockResolvedValue(mockResponse({ ok: true, text: 'ok' }))

    await smmGet('/api/thing/', { keep: 'yes', drop: null, gone: undefined })

    const [url] = lastCall()
    expect(url).toBe('/api/thing/?keep=yes')
  })

  it('appends with & when the url already has a query string', async () => {
    fetchMock.mockResolvedValue(mockResponse({ ok: true, text: 'ok' }))

    await smmGet('/api/thing/?existing=1', { more: 2 })

    expect(lastCall()[0]).toBe('/api/thing/?existing=1&more=2')
  })

  it('calls error with the parsed body and rejects on a non-ok response', async () => {
    fetchMock.mockResolvedValue(mockResponse({ ok: false, status: 403, json: { detail: 'nope' } }))
    const success = vi.fn()
    const error = vi.fn()

    await expect(smmGetJSON('/api/thing/', {}, success, error)).rejects.toThrow('HTTP 403')
    expect(error).toHaveBeenCalledWith({ detail: 'nope' })
    expect(success).not.toHaveBeenCalled()
  })

  it('calls error with no body and rejects when fetch itself fails', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))
    const error = vi.fn()

    await expect(smmGet('/api/thing/', {}, undefined, error)).rejects.toThrow('network down')
    expect(error).toHaveBeenCalledWith()
  })

  it('swallows a throwing success handler and still resolves with the data', async () => {
    fetchMock.mockResolvedValue(mockResponse({ ok: true, json: { ok: 1 } }))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const success = vi.fn(() => {
      throw new Error('handler boom')
    })

    await expect(smmGetJSON('/api/thing/', {}, success)).resolves.toEqual({ ok: 1 })
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})

describe('smmPost', () => {
  it('sends a CSRF header and a form-urlencoded body for a flat object', async () => {
    fetchMock.mockResolvedValue(mockResponse({ ok: true, text: 'ok' }))

    await smmPost('/api/thing/', { name: 'a', count: 2 })

    const [url, options] = lastCall()
    expect(url).toBe('/api/thing/')
    expect(options.method).toBe('POST')
    expect(options.headers).toMatchObject({ 'X-CSRFToken': 'test-token' })
    expect(options.body).toBeInstanceOf(URLSearchParams)
    expect(options.body.toString()).toBe('name=a&count=2')
  })

  it('passes a FormData body through verbatim', async () => {
    fetchMock.mockResolvedValue(mockResponse({ ok: true, text: 'ok' }))
    const fd = new FormData()
    fd.append('file', 'contents')

    await smmPost('/api/upload/', fd)

    expect(lastCall()[1].body).toBe(fd)
  })

  it('sends an empty CSRF header when the token cookie is missing', async () => {
    ;(cookieJar.get as Mock).mockReturnValue(undefined)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockResolvedValue(mockResponse({ ok: true, text: 'ok' }))

    await smmPost('/api/thing/', { a: 1 })

    expect(lastCall()[1].headers).toMatchObject({ 'X-CSRFToken': '' })
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})

describe('smmPatch', () => {
  it('sends a JSON body with the content-type and CSRF headers', async () => {
    fetchMock.mockResolvedValue(mockResponse({ ok: true, text: 'ok' }))

    await smmPatch('/api/thing/1/', { admin: true })

    const [, options] = lastCall()
    expect(options.method).toBe('PATCH')
    expect(options.headers).toMatchObject({ 'Content-Type': 'application/json', 'X-CSRFToken': 'test-token' })
    expect(options.body).toBe(JSON.stringify({ admin: true }))
  })
})

describe('smmDelete', () => {
  it('sends DELETE with the CSRF header and resolves void, invoking success', async () => {
    fetchMock.mockResolvedValue(mockResponse({ ok: true, text: '' }))
    const success = vi.fn()

    await smmDelete('/api/thing/1/', success)

    const [, options] = lastCall()
    expect(options.method).toBe('DELETE')
    expect(options.headers).toMatchObject({ 'X-CSRFToken': 'test-token' })
    expect(success).toHaveBeenCalledTimes(1)
  })
})
