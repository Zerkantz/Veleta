// Cliente HTTP hacia el backend propio (/api).
// Envía credenciales (cookie httpOnly) sólo al mismo origen y nunca expone la clave de OpenWeather.

export async function apiRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const opts = {
    method,
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
  };
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const err = new Error((data && data.error) || `Error HTTP ${res.status}`);
    err.status = res.status;
    err.fields = data?.fields || null;
    err.data = data;
    throw err;
  }
  return data;
}
