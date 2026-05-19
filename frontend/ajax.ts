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

function request<T>(url: string, options: RequestInit, parse: (r: Response) => Promise<T>, success?: (data: T) => void, error?: () => void): Promise<T> {
  return fetchWithTimeout(url, options)
    .then((r) => {
      if (!r.ok) throw r
      return parse(r)
    })
    .then((data) => {
      success?.(data)
      return data
    })
    .catch((err) => {
      error?.()
      throw err
    })
}

function smmGet(url: string, data?: RequestData, success?: (data: unknown) => void, error?: () => void) {
  return request(appendQueryString(url, data), {}, (r) => r.text(), success, error)
}

function smmGetJSON(url: string, data?: RequestData, success?: (data: unknown) => void, error?: () => void) {
  return request(appendQueryString(url, data), { headers: { Accept: 'application/json' } }, (r) => r.json(), success, error)
}

function smmPost(url: string, data: RequestData, success?: (data: unknown) => void, error?: () => void) {
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

function smmPostBody(url: string, body: FormData | URLSearchParams, success?: (data: unknown) => void, error?: () => void) {
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

function smmDelete(url: string, success?: (data: void) => void, error?: () => void) {
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

export { smmGet, smmGetJSON, smmPost, smmPostBody, smmDelete }
