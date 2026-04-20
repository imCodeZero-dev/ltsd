// Consistent JSON response helpers for Route Handlers

export function ok<T>(data: T, meta?: Record<string, unknown>): Response {
  return Response.json({ data, ...(meta ? { meta } : {}) });
}

export function err(message: string, status = 400): Response {
  return Response.json({ error: { message } }, { status });
}

export function created<T>(data: T): Response {
  return Response.json({ data }, { status: 201 });
}
