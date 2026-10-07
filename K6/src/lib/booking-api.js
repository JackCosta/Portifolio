import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from '../config/env.js';
import {
  bookingsReturned,
  functionalErrors,
  networkErrors,
  rateLimited,
  responseSize,
  serverErrors,
} from './metrics.js';

const params = (endpoint) => ({
  headers: { Accept: 'application/json' },
  // "name" agrupa URLs com query string diferente numa única série de métricas,
  // evitando explosão de cardinalidade; "endpoint" é usado nos thresholds.
  tags: { name: `GET /booking (${endpoint})`, endpoint },
  timeout: '30s',
});

const toQuery = (filters) =>
  Object.entries(filters)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

function recordErrors(res) {
  if (res.status === 0) networkErrors.add(1);
  else if (res.status === 429) rateLimited.add(1);
  else if (res.status >= 500) serverErrors.add(1);
}

function parseIds(res) {
  try {
    const body = res.json();
    return Array.isArray(body) ? body : null;
  } catch (_) {
    return null;
  }
}

function getBookings(endpoint, filters = {}) {
  const query = toQuery(filters);
  const url = `${BASE_URL}/booking${query ? `?${query}` : ''}`;
  const res = http.get(url, params(endpoint));

  recordErrors(res);
  responseSize.add(res.body ? res.body.length : 0, { endpoint });

  const ids = res.status === 200 ? parseIds(res) : null;
  const ok = check(
    res,
    {
      'status é 200': (r) => r.status === 200,
      'content-type é JSON': (r) => (r.headers['Content-Type'] || '').includes('application/json'),
      'corpo é um array': () => ids !== null,
      'itens possuem bookingid numérico': () =>
        ids !== null && ids.every((item) => Number.isInteger(item.bookingid)),
    },
    { endpoint },
  );

  functionalErrors.add(!ok, { endpoint });
  if (ids) bookingsReturned.add(ids.length, { endpoint });
  return { res, ids };
}

// Example 1: todos os IDs.
export const listAllBookings = () => getBookings('list_all');

// Example 2: filtro por nome.
export const filterByName = ({ firstname, lastname }) =>
  getBookings('filter_name', { firstname, lastname });

// Example 3: filtro por datas de checkin/checkout (formato CCYY-MM-DD).
export const filterByDates = ({ checkin, checkout }) =>
  getBookings('filter_dates', { checkin, checkout });

export const ping = () => http.get(`${BASE_URL}/ping`, { tags: { name: 'GET /ping' } });
