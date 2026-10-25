import { ApiError } from '../api/client'

/** Best human-readable message for anything thrown by an API call. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return 'Something went wrong. Please try again.'
}
