import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/2.4.0/dist/bundle.js';
import { PROFILE, REPORT_DIR } from '../config/env.js';

// Gera, ao final da execução: resumo no terminal, relatório HTML e JSON bruto (para análise/CI).
export function buildSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [`${REPORT_DIR}/${PROFILE}-summary.html`]: htmlReport(data, {
      title: `Restful-Booker GET /booking: ${PROFILE}`,
    }),
    [`${REPORT_DIR}/${PROFILE}-summary.json`]: JSON.stringify(data, null, 2),
  };
}
