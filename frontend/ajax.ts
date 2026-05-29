import { cookieJar } from './cookies'

const AJAX_TIMEOUT = 2500

type RequestDataValue = string | number | boolean | null | undefined
type RequestData = Record<string, RequestDataValue>

function fetchWithTimeout(url: string, options: RequestInit = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), AJAX_TIMEOUT)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId))
}

function buildSearchParams(data?: RequestData): URLSearchParams {
  const params = new URLSearchParams()
  if (!data) return params
  for (const [key, value] of Object.entries(data)) {
    if (value == null) continue
    params.append(key, String(value))
  }
  return params
}

function appendQueryString(url: string, data?: RequestData): string {
  const params = buildSearchParams(data)
  const qs = params.toString()
  if (!qs) return url
  return `${url}${url.includes('?') ? '&' : '?'}${qs}`
}

function request<T>(url: string, options: RequestInit, parse: (r: Response) => Promise<T>, success?: (data: T) => void, error?: (data?: unknown) => void): Promise<T> {
  let errorHandled = false
  return fetchWithTimeout(url, options)
    .then(async (r): Promise<T> => {
      if (!r.ok) {
        errorHandled = true
        let body: unknown
        try {
          body = await r.json()
        } catch {
          /* ignore parse failure */
        }
        error?.(body)
        throw new Error(`HTTP ${r.status}`)
      }
      return parse(r)
    })
    .then((data) => {
      success?.(data)
      return data
    })
    .catch((err) => {
      if (!errorHandled) error?.()
      throw err
    })
}

function smmGet(url: string, data?: RequestData, success?: (data: string) => void, error?: (data?: unknown) => void): Promise<string> {
  return request<string>(appendQueryString(url, data), {}, (r) => r.text(), success, error)
}

function smmGetJSON<T = unknown>(url: string, data?: RequestData, success?: (data: T) => void, error?: (data?: unknown) => void): Promise<T> {
  return request<T>(appendQueryString(url, data), { headers: { Accept: 'application/json' } }, (r) => r.json(), success, error)
}

function smmPost(url: string, data: RequestData, success?: (data: unknown) => void, error?: (data?: unknown) => void) {
  return request(
    url,
    {
      method: 'POST',
      headers: {
        'X-CSRFToken': cookieJar.get('csrftoken') ?? ''
      },
      body: buildSearchParams(data)
    },
    (r) => r.text(),
    success,
    error
  )
}

function smmPostBody(url: string, body: FormData | URLSearchParams, success?: (data: unknown) => void, error?: (data?: unknown) => void) {
  return request(
    url,
    {
      method: 'POST',
      headers: {
        'X-CSRFToken': cookieJar.get('csrftoken') ?? ''
      },
      body
    },
    (r) => r.text(),
    success,
    error
  )
}

function smmPatch(url: string, data: Record<string, unknown>, success?: (data: string) => void, error?: (data?: unknown) => void) {
  return request(
    url,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': cookieJar.get('csrftoken') ?? ''
      },
      body: JSON.stringify(data)
    },
    (r) => r.text(),
    success,
    error
  )
}

function smmDelete(url: string, success?: (data: void) => void, error?: (data?: unknown) => void) {
  return request<void>(
    url,
    {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': cookieJar.get('csrftoken') ?? ''
      }
    },
    async () => {},
    success,
    error
  )
}

export { smmGet, smmGetJSON, smmPost, smmPostBody, smmPatch, smmDelete }
