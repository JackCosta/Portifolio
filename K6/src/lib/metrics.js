import { Counter, Rate, Trend } from 'k6/metrics';

// Respostas que não passaram nas validações funcionais (status, content-type, JSON).
export const functionalErrors = new Rate('functional_errors');

// Tamanho do corpo da resposta, por endpoint: evidencia o custo de payloads sem paginação.
export const responseSize = new Trend('response_size_bytes');

// Quantidade de reservas retornadas por consulta.
export const bookingsReturned = new Trend('bookings_returned');

// Erros por classe, para separar saturação do servidor (5xx) de limitação (429) e timeout de rede (status 0).
export const serverErrors = new Counter('server_errors_5xx');
export const rateLimited = new Counter('rate_limited_429');
export const networkErrors = new Counter('network_errors');
