// Perfis de carga. O perfil "load" atende ao requisito: 500 usuários simultâneos por 5 minutos.
// Rampa de subida/descida para não gerar um pico artificial de conexões (thundering herd) e
// permitir observar a degradação conforme a concorrência cresce.
export const profiles = {
  // Validação rápida do script antes de rodar a carga (também usado no CI a cada push).
  smoke: {
    executor: 'constant-vus',
    vus: 2,
    duration: '30s',
  },

  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m', target: 500 }, // ramp-up
      { duration: '5m', target: 500 }, // platô: 500 VUs simultâneos por 5 minutos
      { duration: '30s', target: 0 }, // ramp-down
    ],
    gracefulRampDown: '30s',
  },
};
