/**
 * Thin fetch wrapper over the FunderMaps TS API. Injects the Better Auth
 * bearer token, JSON-encodes object bodies, and translates non-OK responses
 * into typed errors. On 401 the caller is expected to redirect to /login —
 * we surface the error rather than handling navigation here so this module
 * stays free of router/component dependencies.
 */

import { trimLeadingChar, trimTrailingChar } from '@/utils/string'
import { getAccessToken, hasAccessToken } from './session'
import { APICallError, APIClientError, APIErrorResponse, APITokenError } from './errors'

interface CallOptions {
  endpoint: string | URL
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: BodyInit | Record<string, unknown>
  queryString?: URLSearchParams | Record<string, string> | string
  requireAuth?: boolean
}

async function makeCall({
  endpoint,
  method = 'GET',
  body,
  queryString,
  requireAuth = true,
}: CallOptions) {
  let fetchOptions = {}
  let responseBody: unknown = null

  try {
    if (requireAuth && !hasAccessToken()) {
      throw new APITokenError('Missing access token')
    }

    const headers: Record<string, string> = {}
    if (requireAuth) {
      headers.Authorization = `Bearer ${getAccessToken()}`
    }

    const url = typeof endpoint === 'string' ? combineEndpoint(endpoint) : endpoint

    if (
      !queryString &&
      (body instanceof URLSearchParams || (method === 'GET' && typeof body === 'string'))
    ) {
      queryString = body as URLSearchParams | string
      body = undefined
    }
    if (queryString && !(queryString instanceof URLSearchParams)) {
      queryString = new URLSearchParams(queryString)
    }
    if (queryString instanceof URLSearchParams) {
      queryString.forEach((value, key) => url.searchParams.append(key, value))
    }

    if (body && typeof body !== 'string' && !(body instanceof FormData)) {
      body = JSON.stringify(body)
      headers['Content-Type'] = 'application/json'
    }

    fetchOptions = { method, headers, body }

    const response = await fetch(url, fetchOptions)

    try {
      if (response.status !== 204) {
        responseBody = await response.json()
      }
    } catch {
      if (response.ok && response.status === 200) {
        throw new Error('Failed to process response body')
      }
    }

    if (!response.ok) {
      throw new APIErrorResponse(response.status, responseBody)
    }

    return responseBody
  } catch (err: unknown) {
    if (err instanceof APIClientError) throw err
    throw new APICallError(err, endpoint, fetchOptions, responseBody)
  }
}

export const get = (opts: Omit<CallOptions, 'method'>) => makeCall({ ...opts, method: 'GET' })
export const post = (opts: Omit<CallOptions, 'method'>) => makeCall({ ...opts, method: 'POST' })
export const put = (opts: Omit<CallOptions, 'method'>) => makeCall({ ...opts, method: 'PUT' })
export const del = (opts: Omit<CallOptions, 'method'>) => makeCall({ ...opts, method: 'DELETE' })

function combineEndpoint(endpoint: string) {
  return new URL(
    `${trimTrailingChar(import.meta.env.VITE_FUNDERMAPS_URL || '', '/')}/api/${trimLeadingChar(endpoint, '/')}`,
  )
}
