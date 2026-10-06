const fs = require("node:fs");
const path = require("node:path");

const JSON_REPORT = path.resolve(__dirname, "../reports/json/cucumber-report.json");

/**
 * Imprime em Markdown um resumo da execução (por cenário) a partir do JSON do Cucumber.
 * No CI a saída é redirecionada para $GITHUB_STEP_SUMMARY.
 */
function buildSummary(title = "Testes E2E") {
  if (!fs.existsSync(JSON_REPORT)) return `## ${title}\n\nRelatório JSON não encontrado.\n`;

  const features = JSON.parse(fs.readFileSync(JSON_REPORT, "utf8"));
  const rows = features.flatMap((feature) =>
    feature.elements
      .filter((element) => element.type === "scenario")
      .map((scenario) => {
        const failed = scenario.steps.find((step) => step.result.status === "failed");
        const passed = scenario.steps.every((step) => step.result.status === "passed");
        const status = failed ? "❌ falhou" : passed ? "✅ passou" : "⚠️ incompleto";
        const error = failed ? String(failed.result.error_message).split("\n")[0].replace(/\|/g, "\\|") : "";
        return { feature: feature.name, name: scenario.name, status, error };
      }),
  );

  const total = rows.length;
  const passed = rows.filter((row) => row.status.includes("passou")).length;

  return [
    `## ${title}`,
    "",
    `**${passed}/${total}** cenários passaram.`,
    "",
    "| Funcionalidade | Cenário | Resultado | Erro |",
    "| --- | --- | --- | --- |",
    ...rows.map((row) => `| ${row.feature} | ${row.name} | ${row.status} | ${row.error} |`),
    "",
  ].join("\n");
}

module.exports = { buildSummary };

if (require.main === module) {
  console.log(buildSummary(process.argv[2]));
}
