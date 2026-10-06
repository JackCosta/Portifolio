const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const JSON_DIR = path.resolve(__dirname, "../reports/json");
const OUTPUT_DIR = path.resolve(__dirname, "../reports/html");

/**
 * Gera o relatório HTML detalhado (dashboard com gráficos, por feature e cenário)
 * a partir do JSON produzido pelo Cucumber.
 */
async function generateReport({ baseUrl, tags, results } = {}) {
  if (!fs.existsSync(JSON_DIR)) {
    console.warn(`[report] ${JSON_DIR} não encontrado, relatório não gerado.`);
    return;
  }

  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });

  // O pacote é distribuído apenas como ESM.
  const { generate } = await import("multiple-cucumber-html-reporter");

  await generate({
    jsonDir: JSON_DIR,
    reportPath: OUTPUT_DIR,
    pageTitle: "Restful Booker - Relatório de Testes de API",
    reportName: "Restful Booker — Testes de API (Cypress + Cucumber)",
    displayDuration: true,
    displayReportTime: true,
    openReportInBrowser: false,
    saveCollectedJSON: false,
    metadata: {
      browser: { name: "electron", version: results?.browserVersion ?? "-" },
      device: os.hostname(),
      platform: { name: os.platform(), version: os.release() },
    },
    customData: {
      title: "Execução",
      data: [
        { label: "API", value: baseUrl ?? "-" },
        { label: "Filtro de tags", value: tags ?? "todas" },
        { label: "Cypress", value: results?.cypressVersion ?? "-" },
        { label: "Node.js", value: process.version },
        { label: "Início", value: results?.startedTestsAt ?? "-" },
        { label: "Fim", value: results?.endedTestsAt ?? "-" },
      ],
    },
  });

  console.log(`\n[report] Relatório detalhado: ${path.join(OUTPUT_DIR, "index.html")}\n`);
}

module.exports = { generateReport };

// Permite gerar o relatório manualmente: node scripts/generate-report.js
if (require.main === module) {
  generateReport();
}
