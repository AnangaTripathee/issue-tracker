import axios from 'axios';

// Error bodies sent by our API (see lib/api.ts):
//   { error: "Validation failed.", details: { formErrors: [...], fieldErrors: { title: [...] } } }
//   { error: "Issue not found." }
export type ApiErrorBody = {
  error?: string;
  details?: { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> };
};

// Returns the API's error body, or {} for network errors and anything unexpected.
export function readApiError(error: unknown): ApiErrorBody {
  if (axios.isAxiosError(error) && error.response?.data && typeof error.response.data === 'object')
    return error.response.data as ApiErrorBody;
  return {};
}
