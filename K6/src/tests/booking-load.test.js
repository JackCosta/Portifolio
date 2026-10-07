import { SharedArray } from 'k6/data';
import { group, sleep } from 'k6';
import exec from 'k6/execution';
import { PROFILE, THINK_TIME_MAX, THINK_TIME_MIN } from '../config/env.js';
import { profiles } from '../config/profiles.js';
import { thresholds } from '../config/thresholds.js';
import { filterByDates, filterByName, listAllBookings, ping } from '../lib/booking-api.js';
import { buildSummary } from '../lib/summary.js';

// Massa de dados carregada uma única vez e compartilhada entre os VUs (economiza memória com 500 VUs).
const names = new SharedArray('names', () => JSON.parse(open('../data/search-params.json')).names);
const dates = new SharedArray('dates', () => JSON.parse(open('../data/search-params.json')).dates);

if (!profiles[PROFILE]) {
  throw new Error(`PROFILE inválido: "${PROFILE}". Use: ${Object.keys(profiles).join(', ')}`);
}

export const options = {
  scenarios: { get_booking: profiles[PROFILE] },
  thresholds,
  userAgent: 'k6-load-test/portfolio (restful-booker GET /booking)',
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

// Mix de tráfego: a listagem completa é a consulta mais comum; os filtros, a busca refinada.
const TRAFFIC_MIX = [
  { weight: 0.5, run: () => group('Example 1 - Todos os IDs', listAllBookings) },
  { weight: 0.3, run: () => group('Example 2 - Filtro por nome', () => filterByName(pick(names))) },
  { weight: 0.2, run: () => group('Example 3 - Filtro por datas', () => filterByDates(pick(dates))) },
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function pickWeighted(mix) {
  let roll = Math.random();
  for (const item of mix) {
    if ((roll -= item.weight) <= 0) return item;
  }
  return mix[mix.length - 1];
}

export function setup() {
  // Não inicia a carga se a API estiver fora do ar.
  const res = ping();
  if (res.status !== 201) {
    exec.test.abort(`API indisponível antes do teste: /ping retornou ${res.status}`);
  }
}

export default function () {
  pickWeighted(TRAFFIC_MIX).run();
  sleep(THINK_TIME_MIN + Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN));
}

export function handleSummary(data) {
  return buildSummary(data);
}
