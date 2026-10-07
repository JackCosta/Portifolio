// Configuração vinda de variáveis de ambiente (k6 run -e CHAVE=valor ...).
export const BASE_URL = __ENV.BASE_URL || 'https://restful-booker.herokuapp.com';
export const PROFILE = __ENV.PROFILE || 'load';

// Tempo de "pensar" do usuário entre requisições (segundos).
export const THINK_TIME_MIN = Number(__ENV.THINK_TIME_MIN || 1);
export const THINK_TIME_MAX = Number(__ENV.THINK_TIME_MAX || 3);

export const REPORT_DIR = __ENV.REPORT_DIR || 'reports';
