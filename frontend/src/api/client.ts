/**
 * Thin wrapper around fetch for talking to the FastAPI backend.
 *
 * - Adds the JSON content type and the stored bearer token.
 * - Turns error responses into ApiError with a human-readable message.
 * - On 401 it clears the token and notifies listeners (AuthContext logs out).
 */

const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? ''
const TOKEN_KEY = 'dealership.token'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type Listener = () => void
const unauthorizedListeners = new Set<Listener>()

/** Persists the JWT. Storage access is wrapped because it can throw (e.g. private mode). */
export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* ignore */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  },
  onUnauthorized(listener: Listener): () => void {
    unauthorizedListeners.add(listener)
    return () => unauthorizedListeners.delete(listener)
  },
}

type QueryValue = string | number | boolean | null | undefined

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  params?: Record<string, QueryValue>
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options
  const headers = new Headers()
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  const token = tokenStore.get()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the API running?')
  }

  if (response.status === 401) {
    tokenStore.clear()
    unauthorizedListeners.forEach((listener) => listener())
  }
  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response))
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

function buildUrl(path: string, params?: Record<string, QueryValue>): string {
  const query = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.append(key, String(value))
  })
  const queryString = query.toString()
  return `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`
}

interface ValidationIssue {
  loc?: (string | number)[]
  msg?: string
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: string | ValidationIssue[] }
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      return data.detail
        .map((issue) => {
          const field = issue.loc?.filter((part) => part !== 'body' && part !== 'query').join('.')
          return field ? `${field}: ${issue.msg}` : (issue.msg ?? 'Invalid value')
        })
        .join('; ')
    }
  } catch {
    /* fall through to the generic message */
  }
  return `Request failed (${response.status})`
}
