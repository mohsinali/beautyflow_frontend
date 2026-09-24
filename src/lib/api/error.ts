export interface ValidationDetail {
  field?: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorPayload {
  statusCode?: number;
  code?: string;
  message?: string;
  details?: unknown;
  requestId?: string;
}

export async function parseApiError(response: Response): Promise<ApiError> {
  let body: ErrorPayload = {};
  try {
    body = (await response.json()) as ErrorPayload;
  } catch {
    // Non-JSON upstream errors are deliberately replaced with a safe message.
  }
  return new ApiError(
    response.status,
    body.code ?? 'UNKNOWN_ERROR',
    body.message ?? 'The request could not be completed',
    body.details,
    body.requestId ?? response.headers.get('x-request-id') ?? undefined,
  );
}
