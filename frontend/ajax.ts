import { cookieJar } from './cookies'

const DEFAULT_TIMEOUT_MS = 30000

type RequestDataValue = string | number | boolean | null | undefined
type RequestData = Record<string, RequestDataValue>

function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number | null = DEFAULT_TIMEOUT_MS) {
  if (timeoutMs == null) {
    return fetch(url, options)
  }
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId))
}

function csrfHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = cookieJar.get<string | undefined>('csrftoken')
  if (!token) {
    console.error('smm: csrftoken cookie is missing - request may fail with HTTP 403')
  }
  return { 'X-CSRFToken': token ?? '', ...extra }
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

function request<T>(
  url: string,
  options: RequestInit,
  parse: (r: Response) => Promise<T>,
  success?: (data: T) => void,
  error?: (data?: unknown) => void,
  timeoutMs: number | null = DEFAULT_TIMEOUT_MS
): Promise<T> {
  let errorHandled = false
  return fetchWithTimeout(url, options, timeoutMs)
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
      try {
        success?.(data)
      } catch (e) {
        console.error('smm request success handler threw:', e)
      }
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

/** POST helper. Pass a flat object for an x-www-form-urlencoded body
 *  (subject to the default request timeout), or a FormData / URLSearchParams
 *  to use it as the body verbatim (no timeout - typical for uploads). */
function smmPost(url: string, data: RequestData | FormData | URLSearchParams, success?: (data: unknown) => void, error?: (data?: unknown) => void) {
  const isRaw = data instanceof FormData || data instanceof URLSearchParams
  const body = isRaw ? data : buildSearchParams(data)
  const timeoutMs = data instanceof FormData ? null : DEFAULT_TIMEOUT_MS
  return request(url, { method: 'POST', headers: csrfHeaders(), body }, (r) => r.text(), success, error, timeoutMs)
}

function smmPatch(url: string, data: Record<string, unknown>, success?: (data: string) => void, error?: (data?: unknown) => void) {
  return request(url, { method: 'PATCH', headers: csrfHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(data) }, (r) => r.text(), success, error)
}

function smmDelete(url: string, success?: (data: void) => void, error?: (data?: unknown) => void) {
  return request<void>(url, { method: 'DELETE', headers: csrfHeaders() }, async () => {}, success, error)
}

export { smmGet, smmGetJSON, smmPost, smmPatch, smmDelete }
