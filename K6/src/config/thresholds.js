// SLOs do teste. Qualquer threshold violado faz o k6 terminar com exit code 99 (falha no CI).
export const thresholds = {
  // Disponibilidade: menos de 1% de requisições com erro (status >= 400 ou falha de rede).
  http_req_failed: ['rate<0.01'],

  // Latência global.
  http_req_duration: ['p(95)<2000', 'p(99)<4000'],

  // Latência por tipo de consulta (tag "endpoint").
  'http_req_duration{endpoint:list_all}': ['p(95)<2500'],
  'http_req_duration{endpoint:filter_name}': ['p(95)<1500'],
  'http_req_duration{endpoint:filter_dates}': ['p(95)<1500'],

  // Validações funcionais (status, content-type, formato do JSON).
  checks: ['rate>0.99'],

  // Proteção da API pública: se mais de 20% das requisições falharem por 1 minuto,
  // o teste é abortado em vez de continuar martelando um serviço já degradado.
  functional_errors: [{ threshold: 'rate<0.20', abortOnFail: true, delayAbortEval: '1m' }],
};
