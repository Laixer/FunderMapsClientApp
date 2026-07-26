/**
 * Errors thrown by the FunderMaps API client. All extend APIClientError so
 * callers can branch on `instanceof APIClientError` for a coarse "API problem"
 * check, then inspect specific subclasses for detail.
 */
export class APIClientError {}

export class APIErrorResponse extends APIClientError {
  status: number
  body: unknown

  constructor(status: number, body: unknown) {
    super()
    this.status = status
    this.body = body
  }
}

export class APIInputError extends APIClientError {
  status = 400
  message: string

  constructor(message: string) {
    super()
    this.message = message
  }
}

export class APITokenError extends APIClientError {
  status = 401
  message: string

  constructor(message: string) {
    super()
    this.message = message
  }
}

export class APICallError extends APIClientError {
  status = 500
  err: unknown
  endpoint: string | URL | undefined
  options: object
  responseBody: unknown

  constructor(
    err: unknown,
    endpoint: string | URL | undefined,
    options: object,
    responseBody: unknown,
  ) {
    super()
    this.err = err
    this.endpoint = endpoint
    this.options = options
    this.responseBody = responseBody
  }
}

/**
 * Best-effort extraction of a human-readable message from a thrown API error.
 * Returns null if nothing useful can be found.
 */
export function getErrorMessage(err: unknown): string | null {
  if (err instanceof APIErrorResponse && err.body && typeof err.body === 'object') {
    const body = err.body as { message?: unknown; error?: unknown }
    if (typeof body.message === 'string' && body.message.trim()) return body.message
    if (typeof body.error === 'string' && body.error.trim()) return body.error
  }
  if (err instanceof APIInputError || err instanceof APITokenError) {
    return err.message
  }
  if (err instanceof APICallError) {
    return getErrorMessage(err.err) ?? getErrorMessage(err.responseBody)
  }
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message
  }
  return null
}

/**
 * What to put in front of a person when a write fails.
 *
 * `getErrorMessage` returns whatever the server said, which for this API is
 * often a bare `"not found"` or a validation blob — true, and useless as the
 * only thing on screen. This leads with the sentence *we* can write ("Opslaan
 * van dit adres is niet gelukt") and keeps the server's own words after it,
 * where they help whoever ends up reading the support thread.
 */
export function describeFailure(err: unknown, whatFailed: string): string {
  const detail = getErrorMessage(err)?.trim()
  if (!detail) return whatFailed
  // Some endpoints already answer with a full Dutch sentence; do not say it twice.
  if (detail.toLowerCase() === whatFailed.toLowerCase()) return whatFailed
  return `${whatFailed} (${detail})`
}
