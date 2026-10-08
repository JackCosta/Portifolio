#!/usr/bin/env node
/**
 * Consolida os resultados de todos os jobs do pipeline em um único relatório.
 *
 * Entrada: uma pasta com um diretório por artefato "results-<suíte>" (formato do actions/download-artifact)
 * e, opcionalmente, NEEDS_JSON com o resultado de cada job (contexto `needs` do GitHub Actions).
 *
 * Saída (na pasta --output):
 *   summary.md   resumo para a página da execução ($GITHUB_STEP_SUMMARY)
 *   report.html  relatório detalhado, pronto para impressão/PDF
 *   results.json dados consolidados
 *   gate.txt     "aprovado" ou "reprovado"
 *
 * Uso: node consolidate-report.mjs --input pipeline-results --output pipeline-report
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Catálogo de suítes e jobs
// ---------------------------------------------------------------------------

const SAUCEDEMO = "SauceDemo";
const BOOKER = "Restful-Booker";
const PW_TOOL = "Playwright + playwright-bdd (TypeScript)";

const SUITES = [
  {
    id: "api-cypress",
    job: "api-cypress",
    layer: "API",
    app: BOOKER,
    tool: "Cypress + Cucumber",
    format: "cucumber",
  },
  {
    id: "api-rest-assured",
    job: "api-rest-assured",
    layer: "API",
    app: BOOKER,
    tool: "Java 21 + Rest Assured + Cucumber",
    format: "junit",
  },
  {
    id: "e2e-cypress",
    job: "e2e-cypress",
    layer: "E2E",
    app: SAUCEDEMO,
    tool: "Cypress + Cucumber",
    target: "Electron",
    format: "cucumber",
  },
  {
    id: "e2e-playwright-chromium",
    job: "e2e-playwright",
    layer: "E2E",
    app: SAUCEDEMO,
    tool: PW_TOOL,
    target: "Chromium",
    format: "junit",
  },
  {
    id: "e2e-playwright-firefox",
    job: "e2e-playwright",
    layer: "E2E",
    app: SAUCEDEMO,
    tool: PW_TOOL,
    target: "Firefox",
    format: "junit",
  },
  {
    id: "e2e-playwright-webkit",
    job: "e2e-playwright",
    layer: "E2E",
    app: SAUCEDEMO,
    tool: PW_TOOL,
    target: "WebKit",
    format: "junit",
  },
  {
    id: "mobile-pixel-7",
    job: "mobile",
    layer: "Mobile",
    app: SAUCEDEMO,
    tool: PW_TOOL,
    target: "Android · Pixel 7",
    format: "junit",
  },
  {
    id: "mobile-iphone-15",
    job: "mobile",
    layer: "Mobile",
    app: SAUCEDEMO,
    tool: PW_TOOL,
    target: "iOS · iPhone 15",
    format: "junit",
  },
  { id: "performance-k6", job: "performance", layer: "Performance", app: BOOKER, tool: "k6", format: "k6" },
  {
    id: "known-bugs-api-cypress",
    job: "known-bugs-api-cypress",
    layer: "API",
    app: BOOKER,
    tool: "Cypress + Cucumber",
    format: "cucumber",
    knownBugs: true,
  },
  {
    id: "known-bugs-api-rest-assured",
    job: "known-bugs-api-rest-assured",
    layer: "API",
    app: BOOKER,
    tool: "Java 21 + Rest Assured + Cucumber",
    format: "junit",
    knownBugs: true,
  },
  {
    id: "known-bugs-e2e-cypress",
    job: "known-bugs-e2e-cypress",
    layer: "E2E",
    app: SAUCEDEMO,
    tool: "Cypress + Cucumber",
    format: "cucumber",
    knownBugs: true,
  },
];

const JOBS = [
  { id: "quality", name: "Qualidade (lint, tipos, compilação)", stage: 1, blocking: true },
  { id: "api-cypress", name: "API · Cypress", stage: 2, blocking: true },
  { id: "api-rest-assured", name: "API · Rest Assured", stage: 2, blocking: true },
  { id: "e2e-cypress", name: "E2E · Cypress", stage: 2, blocking: true },
  { id: "e2e-playwright", name: "E2E · Playwright (3 navegadores)", stage: 2, blocking: true },
  { id: "mobile", name: "Mobile · Playwright (2 dispositivos)", stage: 2, blocking: true },
  { id: "performance", name: "Performance · k6", stage: 3, blocking: true },
  { id: "known-bugs-api-cypress", name: "Defeitos conhecidos · API Cypress", stage: 2, blocking: false },
  {
    id: "known-bugs-api-rest-assured",
    name: "Defeitos conhecidos · API Rest Assured",
    stage: 2,
    blocking: false,
  },
  { id: "known-bugs-e2e-cypress", name: "Defeitos conhecidos · E2E Cypress", stage: 2, blocking: false },
];

const LAYERS = ["API", "E2E", "Mobile", "Performance"];

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .reduce(
      (pairs, arg, i, all) => (arg.startsWith("--") ? [...pairs, [arg.slice(2), all[i + 1]]] : pairs),
      [],
    ),
);
const INPUT = path.resolve(args.input ?? "pipeline-results");
const OUTPUT = path.resolve(args.output ?? "pipeline-report");

const findFiles = (dir, matcher) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return findFiles(full, matcher);
    return matcher(entry.name) ? [full] : [];
  });
};

const decodeXml = (text = "") =>
  text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&");

const escapeHtml = (text = "") =>
  String(text).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const escapeMd = (text = "") => String(text).replace(/\|/g, "\\|").replace(/\n/g, " ");

// Remove códigos de cor ANSI e junta as linhas da mensagem de erro até o início da pilha de chamadas
// (AssertJ e Cypress quebram a mensagem em várias linhas).
const MAX_ERROR_LENGTH = 220;
const firstErrorLine = (message = "") => {
  const lines = String(message)
    .replace(/\u001b\[[0-9;]*m/g, "")
    .split("\n")
    .map((line) => line.trim());
  const stackStart = lines.findIndex((line) => /^at\s/.test(line));
  const text = (stackStart === -1 ? lines : lines.slice(0, stackStart))
    .filter((line) => line && !/^org\.opentest4j\.\w+:?$/.test(line))
    .join(" ")
    .replace(/^org\.opentest4j\.\w+:\s*/, "");
  return text.length > MAX_ERROR_LENGTH ? `${text.slice(0, MAX_ERROR_LENGTH - 1)}…` : text;
};

const parseAttributes = (text) =>
  Object.fromEntries([...text.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, k, v]) => [k, decodeXml(v)]));

const formatDuration = (ms) => {
  if (ms == null || Number.isNaN(ms)) return "-";
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  return `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s`;
};

const percent = (part, total) => (total ? `${((part / total) * 100).toFixed(1)}%` : "-");

const gitInfo = (command) => {
  try {
    return execSync(command, {
      cwd: path.dirname(new URL(import.meta.url).pathname),
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
};

// ---------------------------------------------------------------------------
// Leitores de resultado
// ---------------------------------------------------------------------------

/** Cucumber JSON (Cypress + @badeball/cypress-cucumber-preprocessor). Durações em nanossegundos. */
function readCucumber(dir) {
  const file = findFiles(dir, (name) => name === "cucumber-report.json")[0];
  if (!file) return null;
  const features = JSON.parse(fs.readFileSync(file, "utf8"));
  return features.flatMap((feature) =>
    (feature.elements ?? [])
      .filter((element) => element.type === "scenario")
      .map((scenario) => {
        const steps = scenario.steps ?? [];
        const failed = steps.find((step) => step.result?.status === "failed");
        const allPassed = steps.length > 0 && steps.every((step) => step.result?.status === "passed");
        const durationNs = steps.reduce((total, step) => total + (step.result?.duration ?? 0), 0);
        const evidence = steps.reduce(
          (total, step) =>
            total + (step.embeddings ?? []).filter((e) => e.mime_type?.startsWith("image/")).length,
          0,
        );
        return {
          feature: feature.name,
          name: scenario.name,
          status: failed ? "failed" : allPassed ? "passed" : "skipped",
          durationMs: durationNs / 1e6,
          error: failed ? firstErrorLine(failed.result.error_message) : "",
          failedStep: failed ? `${failed.keyword?.trim() ?? ""} ${failed.name}`.trim() : "",
          tags: (scenario.tags ?? []).map((tag) => tag.name),
          evidence,
        };
      }),
  );
}

/** JUnit XML (Surefire do Rest Assured e reporter junit do Playwright). */
function readJUnit(dir) {
  const files = findFiles(dir, (name) => /^TEST-.*\.xml$/.test(name) || name === "results.xml");
  if (files.length === 0) return null;
  return files.flatMap((file) => {
    const xml = fs.readFileSync(file, "utf8");
    return [...xml.matchAll(/<testcase\s([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g)].map(
      ([, rawAttrs, body = ""]) => {
        const attrs = parseAttributes(rawAttrs);
        const failure = body.match(/<(failure|error)\b([^>]*)>([\s\S]*?)<\/\1>|<(failure|error)\b([^>]*)\/>/);
        const skipped = /<skipped\b/.test(body);
        // Playwright: "Feature › [Esquema ›] Cenário"; Surefire/Cucumber: classname = feature.
        const parts = attrs.name.split(" › ");
        const feature = parts.length > 1 ? parts[0] : attrs.classname;
        const name = parts.length > 1 ? parts[parts.length - 1] : attrs.name;
        let error = "";
        if (failure) {
          const failureAttrs = parseAttributes(failure[2] ?? failure[5] ?? "");
          error = firstErrorLine(
            failureAttrs.message || decodeXml(failure[3] ?? "").replace(/<!\[CDATA\[|\]\]>/g, ""),
          );
        }
        return {
          feature,
          name,
          status: failure ? "failed" : skipped ? "skipped" : "passed",
          durationMs: Number(attrs.time ?? 0) * 1000,
          error,
          failedStep: "",
          tags: [],
          evidence: 0,
        };
      },
    );
  });
}

/** Resumo JSON do k6 (handleSummary). */
function readK6(dir) {
  const file = findFiles(dir, (name) => /-summary\.json$/.test(name))[0];
  if (!file) return null;
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const metric = (name) => data.metrics?.[name]?.values ?? {};
  const thresholds = Object.entries(data.metrics ?? {}).flatMap(([name, m]) =>
    Object.entries(m.thresholds ?? {}).map(([expression, result]) => ({
      metric: name,
      expression,
      ok: result.ok,
    })),
  );
  const duration = metric("http_req_duration");
  const profile = path.basename(file).replace(/-summary\.json$/, "");
  return {
    profile,
    testRunDurationMs: data.state?.testRunDurationMs,
    requests: metric("http_reqs").count,
    rps: metric("http_reqs").rate,
    errorRate: metric("http_req_failed").rate,
    checksPassed: metric("checks").passes,
    checksFailed: metric("checks").fails,
    iterations: metric("iterations").count,
    vusMax: metric("vus_max").value ?? metric("vus_max").max,
    dataReceived: metric("data_received").count,
    latency: {
      avg: duration.avg,
      med: duration.med,
      p90: duration["p(90)"],
      p95: duration["p(95)"],
      p99: duration["p(99)"],
      max: duration.max,
    },
    thresholds,
  };
}

// ---------------------------------------------------------------------------
// Consolidação
// ---------------------------------------------------------------------------

const needs = (() => {
  try {
    return JSON.parse(process.env.NEEDS_JSON || "{}");
  } catch {
    return {};
  }
})();

const jobs = JOBS.map((job) => ({
  ...job,
  result: needs[job.id]?.result ?? "unknown",
  durationMs: needs[job.id]?.duration_ms,
}));
const jobById = Object.fromEntries(jobs.map((job) => [job.id, job]));

const suites = SUITES.map((suite) => {
  const dir = path.join(INPUT, `results-${suite.id}`);
  const job = jobById[suite.job];
  const base = { ...suite, jobResult: job.result, found: fs.existsSync(dir) };

  if (suite.format === "k6") {
    const k6 = readK6(dir);
    if (!k6)
      return {
        ...base,
        status: "missing",
        cases: [],
        totals: { total: 0, passed: 0, failed: 0, skipped: 0 },
      };
    const failedThresholds = k6.thresholds.filter((t) => !t.ok);
    const cases = k6.thresholds.map((t) => ({
      feature: "Thresholds",
      name: `${t.metric}: ${t.expression}`,
      status: t.ok ? "passed" : "failed",
      durationMs: 0,
      error: t.ok ? "" : "Threshold violado",
      tags: [],
      evidence: 0,
    }));
    return {
      ...base,
      k6,
      cases,
      status: failedThresholds.length ? "failed" : "passed",
      durationMs: k6.testRunDurationMs,
      totals: {
        total: cases.length,
        passed: cases.length - failedThresholds.length,
        failed: failedThresholds.length,
        skipped: 0,
      },
    };
  }

  const cases = (suite.format === "cucumber" ? readCucumber(dir) : readJUnit(dir)) ?? null;
  if (!cases)
    return { ...base, status: "missing", cases: [], totals: { total: 0, passed: 0, failed: 0, skipped: 0 } };

  const totals = {
    total: cases.length,
    passed: cases.filter((c) => c.status === "passed").length,
    failed: cases.filter((c) => c.status === "failed").length,
    skipped: cases.filter((c) => c.status === "skipped").length,
  };
  return {
    ...base,
    cases,
    totals,
    status: totals.failed ? "failed" : "passed",
    durationMs: cases.reduce((total, c) => total + c.durationMs, 0),
    evidence: cases.reduce((total, c) => total + c.evidence, 0),
  };
});

const blockingSuites = suites.filter((s) => !s.knownBugs);
const knownBugSuites = suites.filter((s) => s.knownBugs);

const sum = (list, key) => list.reduce((total, s) => total + s.totals[key], 0);
const functionalSuites = blockingSuites.filter((s) => s.format !== "k6");
const totals = {
  scenarios: sum(functionalSuites, "total"),
  passed: sum(functionalSuites, "passed"),
  failed: sum(functionalSuites, "failed"),
  skipped: sum(functionalSuites, "skipped"),
  expectedFailures: sum(knownBugSuites, "failed"),
  bugsPassing: sum(knownBugSuites, "passed"),
  evidence: suites.reduce((total, s) => total + (s.evidence ?? 0), 0),
};

const blockingJobs = jobs.filter((job) => job.blocking);
const failedBlockingJobs = blockingJobs.filter((job) => job.result !== "success");
const gate = failedBlockingJobs.length === 0 ? "aprovado" : "reprovado";

const isCI = Boolean(process.env.GITHUB_ACTIONS);
const run = {
  mode: isCI ? "GitHub Actions" : "Execução local (ci/run-local.sh)",
  runner: isCI
    ? `${process.env.RUNNER_OS ?? "Linux"} · ubuntu-latest`
    : `${process.platform} · Node ${process.version}`,
  url: process.env.RUN_URL ?? "",
  event: process.env.GITHUB_EVENT_NAME ?? "manual (local)",
  branch: process.env.GITHUB_REF_NAME ?? gitInfo("git rev-parse --abbrev-ref HEAD"),
  commit: (process.env.GITHUB_SHA ?? gitInfo("git rev-parse HEAD")).slice(0, 7),
  commitMessage: gitInfo("git log -1 --pretty=%s"),
  dirty: !isCI && gitInfo("git status --porcelain") !== "",
  startedAt: process.env.PIPELINE_STARTED_AT ?? "",
  finishedAt: process.env.PIPELINE_FINISHED_AT ?? new Date().toISOString(),
  wallMs: process.env.PIPELINE_WALL_MS ? Number(process.env.PIPELINE_WALL_MS) : undefined,
};

// ---------------------------------------------------------------------------
// Saída: Markdown
// ---------------------------------------------------------------------------

const STATUS_LABEL = {
  passed: "✅ passou",
  failed: "❌ falhou",
  skipped: "⏭️ ignorado",
  missing: "⚠️ sem resultados",
};
const JOB_LABEL = {
  success: "✅ sucesso",
  failure: "❌ falha",
  cancelled: "⛔ cancelado",
  skipped: "⏭️ não executado",
  unknown: "–",
};

const suiteLabel = (s) => [s.tool, s.target].filter(Boolean).join(" · ");

function buildMarkdown() {
  const lines = [
    `# Pipeline de Qualidade: ${gate === "aprovado" ? "✅ aprovado" : "❌ reprovado"}`,
    "",
    `**${totals.passed}/${totals.scenarios - totals.skipped}** cenários funcionais executados passaram (${percent(totals.passed, totals.scenarios - totals.skipped)}); ${totals.skipped} ignorado(s). ` +
      `Falhas inesperadas: **${totals.failed}**. Falhas esperadas (@bug): **${totals.expectedFailures}**.`,
    "",
    "| Camada | Suíte | Aplicação | Resultado | Total | ✅ | ❌ | ⏭️ |",
    "| --- | --- | --- | --- | --: | --: | --: | --: |",
    ...blockingSuites.map(
      (s) =>
        `| ${s.layer} | ${suiteLabel(s)} | ${s.app} | ${STATUS_LABEL[s.status]} | ${s.totals.total} | ${s.totals.passed} | ${s.totals.failed} | ${s.totals.skipped} |`,
    ),
    "",
  ];

  const perf = suites.find((s) => s.k6)?.k6;
  if (perf) {
    lines.push(
      `**Performance (k6 ${perf.profile}):** ${perf.requests} requisições, erro ${(perf.errorRate * 100).toFixed(2)}%, ` +
        `p95 ${perf.latency.p95?.toFixed(0)} ms, thresholds ${perf.thresholds.filter((t) => t.ok).length}/${perf.thresholds.length} ok.`,
      "",
    );
  }

  const unexpected = blockingSuites.flatMap((s) =>
    s.cases.filter((c) => c.status === "failed").map((c) => ({ s, c })),
  );
  if (unexpected.length) {
    lines.push("### ❌ Falhas inesperadas", "", "| Suíte | Cenário | Erro |", "| --- | --- | --- |");
    unexpected.forEach(({ s, c }) =>
      lines.push(`| ${suiteLabel(s)} | ${escapeMd(c.name)} | ${escapeMd(c.error)} |`),
    );
    lines.push("");
  }

  const expected = knownBugSuites.flatMap((s) =>
    s.cases.filter((c) => c.status === "failed").map((c) => ({ s, c })),
  );
  if (expected.length) {
    lines.push(
      "### 🐞 Falhas esperadas (defeitos conhecidos)",
      "",
      "| Aplicação | Cenário | Erro registrado |",
      "| --- | --- | --- |",
    );
    expected.forEach(({ s, c }) => lines.push(`| ${s.app} | ${escapeMd(c.name)} | ${escapeMd(c.error)} |`));
    lines.push("");
  }

  lines.push("### Jobs", "", "| Job | Bloqueante | Resultado |", "| --- | --- | --- |");
  jobs.forEach((job) =>
    lines.push(`| ${job.name} | ${job.blocking ? "sim" : "não"} | ${JOB_LABEL[job.result] ?? job.result} |`),
  );
  lines.push("", "O relatório detalhado (HTML e PDF) está no artefato `pipeline-report`.", "");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Saída: HTML (pensado para impressão em A4)
// ---------------------------------------------------------------------------

const badge = (status, text) => `<span class="badge ${status}">${escapeHtml(text)}</span>`;
const STATUS_BADGE = {
  passed: () => badge("passed", "passou"),
  failed: () => badge("failed", "falhou"),
  skipped: () => badge("skipped", "ignorado"),
  missing: () => badge("skipped", "sem resultados"),
  expected: () => badge("expected", "falha esperada"),
};
const JOB_BADGE = {
  success: () => badge("passed", "sucesso"),
  failure: () => badge("failed", "falha"),
  cancelled: () => badge("failed", "cancelado"),
  skipped: () => badge("skipped", "não executado"),
  unknown: () => badge("skipped", "–"),
};

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        dateStyle: "short",
        timeStyle: "medium",
      })
    : "-";

function kpi(value, label, tone = "") {
  return `<div class="kpi ${tone}"><div class="kpi-value">${value}</div><div class="kpi-label">${label}</div></div>`;
}

function executiveSummary() {
  const points = [];
  if (gate === "aprovado") {
    points.push(
      `Todos os ${blockingJobs.length} jobs bloqueantes terminaram com sucesso, e o <strong>quality gate foi aprovado</strong>.`,
    );
  } else {
    points.push(
      `O <strong>quality gate foi reprovado</strong>: ${failedBlockingJobs.map((j) => escapeHtml(j.name)).join(", ")} não terminaram com sucesso.`,
    );
  }
  points.push(
    `${totals.passed} de ${totals.scenarios - totals.skipped} cenários funcionais executados passaram (${percent(totals.passed, totals.scenarios - totals.skipped)}), ` +
      `distribuídos em ${functionalSuites.length} suítes de API, E2E e mobile.`,
  );
  if (totals.failed)
    points.push(`<strong>${totals.failed} falhas inesperadas</strong> precisam de análise (seção 6).`);
  if (totals.skipped)
    points.push(
      `${totals.skipped} cenário(s) ignorado(s): são os cenários <code>@bug</code> excluídos da execução padrão.`,
    );
  if (totals.expectedFailures)
    points.push(
      `${totals.expectedFailures} falhas esperadas confirmam defeitos conhecidos das aplicações (seção 7). Elas não reprovam o pipeline.`,
    );
  if (totals.bugsPassing)
    points.push(
      `<strong>${totals.bugsPassing} cenário(s) <code>@bug</code> passaram</strong>: o defeito pode ter sido corrigido e a tag deve ser revista.`,
    );
  const perf = suites.find((s) => s.k6)?.k6;
  if (perf) {
    const okCount = perf.thresholds.filter((t) => t.ok).length;
    points.push(
      `Performance (perfil ${escapeHtml(perf.profile)}): ${perf.requests} requisições com ${(perf.errorRate * 100).toFixed(2)}% de erro e p95 de ${perf.latency.p95?.toFixed(0)} ms; ${okCount} de ${perf.thresholds.length} thresholds atendidos.`,
    );
  }
  const missing = suites.filter((s) => s.status === "missing" && s.jobResult !== "skipped");
  if (missing.length)
    points.push(`Sem resultados para: ${missing.map((s) => escapeHtml(suiteLabel(s))).join(", ")}.`);
  return `<ul class="summary">${points.map((p) => `<li>${p}</li>`).join("")}</ul>`;
}

function pipelineDiagram() {
  const box = (title, items, tone = "") =>
    `<div class="stage ${tone}"><div class="stage-title">${title}</div>${items.map((i) => `<div class="stage-item">${i}</div>`).join("")}</div>`;
  return `
  <div class="flow">
    ${box("1 · Qualidade", ["Lint e formatação", "Tipos (TypeScript)", "Compilação (Java)", "Validação do script k6"])}
    <div class="arrow">→</div>
    <div class="parallel">
      <div class="row">
        ${box("2 · API", ["Cypress + Cucumber", "Rest Assured (Java)"])}
        <div class="arrow">→</div>
        ${box("3 · Performance", ["k6 smoke a cada commit", "carga 500 VUs sob demanda"])}
      </div>
      ${box("2 · E2E", ["Cypress (Electron)", "Playwright: Chromium, Firefox, WebKit"])}
      ${box("2 · Mobile", ["Pixel 7 (Android)", "iPhone 15 (iOS)"])}
      ${box("Defeitos conhecidos", ["Cenários @bug, não bloqueantes"], "muted")}
    </div>
    <div class="arrow">→</div>
    ${box("4 · Relatório", ["Markdown, HTML e PDF", "Quality gate"])}
  </div>`;
}

function suiteOverviewTable(list) {
  const rows = list
    .map(
      (s) => `<tr>
        <td>${escapeHtml(s.layer)}</td>
        <td>${escapeHtml(s.tool)}${s.target ? `<div class="muted">${escapeHtml(s.target)}</div>` : ""}</td>
        <td>${escapeHtml(s.app)}</td>
        <td class="num">${s.totals.total}</td>
        <td class="num ok">${s.totals.passed}</td>
        <td class="num ${s.totals.failed ? (s.knownBugs ? "warn" : "bad") : ""}">${s.totals.failed}</td>
        <td class="num">${s.totals.skipped}</td>
        <td class="num">${s.format === "k6" ? "-" : percent(s.totals.passed, s.totals.total - s.totals.skipped)}</td>
        <td class="num">${formatDuration(s.durationMs)}</td>
        <td>${s.knownBugs && s.status === "failed" ? STATUS_BADGE.expected() : STATUS_BADGE[s.status]()}</td>
      </tr>`,
    )
    .join("");
  return `<table>
    <thead><tr><th>Camada</th><th>Ferramenta</th><th>Aplicação</th><th class="num">Total</th><th class="num">Passou</th>
    <th class="num">Falhou</th><th class="num">Ignorado</th><th class="num">Sucesso</th><th class="num">Tempo*</th><th>Resultado</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

function jobsTable() {
  const showDuration = jobs.some((job) => job.durationMs != null);
  return `<table>
    <thead><tr><th>Estágio</th><th>Job</th><th>Bloqueante</th>${showDuration ? '<th class="num">Duração</th>' : ""}<th>Resultado</th></tr></thead>
    <tbody>${jobs
      .map(
        (job) =>
          `<tr><td>${job.stage}</td><td>${escapeHtml(job.name)}</td><td>${job.blocking ? "sim" : "não"}</td>${
            showDuration ? `<td class="num">${formatDuration(job.durationMs)}</td>` : ""
          }<td>${(JOB_BADGE[job.result] ?? JOB_BADGE.unknown)()}</td></tr>`,
      )
      .join("")}</tbody></table>`;
}

function scenarioTable(suite) {
  const groups = new Map();
  suite.cases.forEach((c) => groups.set(c.feature, [...(groups.get(c.feature) ?? []), c]));
  const showEvidence = suite.cases.some((c) => c.evidence);
  return [...groups.entries()]
    .map(
      ([feature, cases]) => `
      <h4>${escapeHtml(feature)}</h4>
      <table class="compact">
        <thead><tr><th>Cenário</th><th class="num">Tempo</th>${showEvidence ? '<th class="num">Prints</th>' : ""}<th>Resultado</th></tr></thead>
        <tbody>${cases
          .map(
            (c) => `<tr>
              <td>${escapeHtml(c.name)}${c.error ? `<div class="error">${escapeHtml(c.error)}</div>` : ""}</td>
              <td class="num">${formatDuration(c.durationMs)}</td>
              ${showEvidence ? `<td class="num">${c.evidence}</td>` : ""}
              <td>${suite.knownBugs && c.status === "failed" ? STATUS_BADGE.expected() : STATUS_BADGE[c.status]()}</td>
            </tr>`,
          )
          .join("")}</tbody>
      </table>`,
    )
    .join("");
}

/** Matriz cenário × navegador/dispositivo para as suítes Playwright (E2E e Mobile). */
function crossBrowserMatrix() {
  const pwSuites = suites.filter((s) => s.tool === PW_TOOL && s.cases.length);
  if (!pwSuites.length) return "<p>Sem resultados do Playwright.</p>";
  const keys = [];
  const index = new Map();
  pwSuites.forEach((s) =>
    s.cases.forEach((c) => {
      const key = `${c.feature}|||${c.name}`;
      if (!index.has(key)) {
        index.set(key, {});
        keys.push(key);
      }
      index.get(key)[s.id] = c;
    }),
  );
  const cell = (c) =>
    !c
      ? "–"
      : c.status === "passed"
        ? '<span class="tick">✓</span>'
        : c.status === "failed"
          ? '<span class="cross">✗</span>'
          : "○";
  let lastFeature = "";
  const rows = keys
    .map((key) => {
      const [feature, name] = key.split("|||");
      const header =
        feature !== lastFeature
          ? `<tr class="group"><td colspan="${pwSuites.length + 1}">${escapeHtml(feature)}</td></tr>`
          : "";
      lastFeature = feature;
      return `${header}<tr><td>${escapeHtml(name)}</td>${pwSuites.map((s) => `<td class="center">${cell(index.get(key)[s.id])}</td>`).join("")}</tr>`;
    })
    .join("");
  const footer = `<tr class="total"><td>Total aprovado</td>${pwSuites
    .map((s) => `<td class="center">${s.totals.passed}/${s.totals.total}</td>`)
    .join("")}</tr>`;
  return `<table class="compact matrix">
    <thead><tr><th>Cenário</th>${pwSuites.map((s) => `<th class="center">${escapeHtml(s.layer)}<br>${escapeHtml(s.target)}</th>`).join("")}</tr></thead>
    <tbody>${rows}${footer}</tbody></table>`;
}

function performanceSection() {
  const suite = suites.find((s) => s.format === "k6");
  if (!suite?.k6)
    return `<p>Sem resultados do k6 (job: ${escapeHtml(JOB_LABEL[suite?.jobResult] ?? "-")}).</p>`;
  const k = suite.k6;
  const ms = (v) => (v == null ? "-" : `${v.toFixed(0)} ms`);
  return `
    <div class="kpis">
      ${kpi(k.requests ?? "-", "requisições")}
      ${kpi(k.rps != null ? k.rps.toFixed(1) : "-", "requisições/s")}
      ${kpi(`${((k.errorRate ?? 0) * 100).toFixed(2)}%`, "taxa de erro", k.errorRate > 0.01 ? "bad" : "ok")}
      ${kpi(ms(k.latency.p95), "latência p95")}
      ${kpi(k.vusMax ?? "-", "usuários virtuais")}
      ${kpi(formatDuration(k.testRunDurationMs), "duração")}
    </div>
    <table class="compact">
      <thead><tr><th>Latência (http_req_duration)</th><th class="num">média</th><th class="num">mediana</th><th class="num">p90</th>
      <th class="num">p95</th><th class="num">p99</th><th class="num">máx.</th></tr></thead>
      <tbody><tr><td>Todas as requisições</td><td class="num">${ms(k.latency.avg)}</td><td class="num">${ms(k.latency.med)}</td>
      <td class="num">${ms(k.latency.p90)}</td><td class="num">${ms(k.latency.p95)}</td><td class="num">${ms(k.latency.p99)}</td>
      <td class="num">${ms(k.latency.max)}</td></tr></tbody>
    </table>
    <table class="compact">
      <thead><tr><th>Threshold</th><th>Expressão</th><th>Resultado</th></tr></thead>
      <tbody>${k.thresholds
        .map(
          (t) =>
            `<tr><td><code>${escapeHtml(t.metric)}</code></td><td><code>${escapeHtml(t.expression)}</code></td><td>${t.ok ? STATUS_BADGE.passed() : STATUS_BADGE.failed()}</td></tr>`,
        )
        .join("")}</tbody>
    </table>
    <p class="note">Checks: ${k.checksPassed ?? 0} aprovados e ${k.checksFailed ?? 0} reprovados, em ${k.iterations ?? 0} iterações.
    ${
      k.profile === "smoke"
        ? "O perfil <strong>smoke</strong> (2 usuários por 30 s) roda a cada commit para validar o script e os thresholds sem gerar carga na API pública. A carga de 500 usuários por 5 minutos é disparada manualmente (<code>workflow_dispatch</code>, perfil <code>load</code>); a análise dessa execução está em <code>K6/reports/RELATORIO.md</code>."
        : ""
    }</p>`;
}

function failuresTable(entries, emptyText) {
  if (!entries.length) return `<p class="empty">${emptyText}</p>`;
  return `<table class="compact">
    <thead><tr><th>Suíte</th><th>Cenário</th><th>Erro registrado</th></tr></thead>
    <tbody>${entries
      .map(
        ({ s, c }) => `<tr><td>${escapeHtml(suiteLabel(s))}<div class="muted">${escapeHtml(s.app)}</div></td>
        <td>${escapeHtml(c.name)}${c.failedStep ? `<div class="muted">Passo: ${escapeHtml(c.failedStep)}</div>` : ""}</td>
        <td class="error">${escapeHtml(c.error)}</td></tr>`,
      )
      .join("")}</tbody></table>`;
}

function buildHtml() {
  const unexpected = blockingSuites.flatMap((s) =>
    s.cases.filter((c) => c.status === "failed").map((c) => ({ s, c })),
  );
  const expected = knownBugSuites.flatMap((s) =>
    s.cases.filter((c) => c.status === "failed").map((c) => ({ s, c })),
  );
  const bugsPassing = knownBugSuites.flatMap((s) =>
    s.cases.filter((c) => c.status === "passed").map((c) => ({ s, c })),
  );
  const detailSuites = suites.filter(
    (s) => s.cases.length && s.format !== "k6" && s.tool !== PW_TOOL && !s.knownBugs,
  );

  const meta = [
    ["Origem", escapeHtml(run.mode)],
    ["Ambiente", escapeHtml(run.runner)],
    ["Evento", escapeHtml(run.event)],
    ["Branch", `<code>${escapeHtml(run.branch)}</code>`],
    [
      "Commit",
      `<code>${escapeHtml(run.commit)}</code> ${escapeHtml(run.commitMessage)}${run.dirty ? ' <span class="muted">(com alterações locais não commitadas)</span>' : ""}`,
    ],
    ["Início", formatDate(run.startedAt)],
    ["Fim", formatDate(run.finishedAt)],
    ...(run.wallMs ? [["Duração total", formatDuration(run.wallMs)]] : []),
    ...(run.url ? [["Execução", `<a href="${escapeHtml(run.url)}">${escapeHtml(run.url)}</a>`]] : []),
  ];

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Relatório do Pipeline de Qualidade</title>
<style>
  :root { --ink:#1f2328; --muted:#636c76; --line:#d8dee4; --soft:#f6f8fa; --ok:#1a7f37; --ok-bg:#dafbe1;
          --bad:#cf222e; --bad-bg:#ffebe9; --warn:#9a6700; --warn-bg:#fff8c5; --accent:#0969da; }
  @page { size: A4; margin: 16mm 14mm 18mm; }
  * { box-sizing: border-box; }
  body { font: 10.5pt/1.45 -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: var(--ink); margin: 0 auto; max-width: 1000px; padding: 24px; background: #fff; }
  @media print { body { padding: 0; max-width: none; } }
  h1 { font-size: 21pt; margin: 0 0 4px; }
  h2 { font-size: 14pt; margin: 26px 0 10px; padding-bottom: 4px; border-bottom: 2px solid var(--ink); break-after: avoid; }
  h3 { font-size: 11.5pt; margin: 18px 0 6px; break-after: avoid; }
  h4 { font-size: 10pt; margin: 12px 0 4px; color: var(--muted); break-after: avoid; }
  p { margin: 6px 0; }
  code { font: 9pt ui-monospace, SFMono-Regular, Menlo, monospace; background: var(--soft); padding: 1px 4px; border-radius: 4px; }
  a { color: var(--accent); }
  .cover { border: 1px solid var(--line); border-radius: 10px; padding: 18px 20px; margin-bottom: 8px; }
  .subtitle { color: var(--muted); margin-bottom: 14px; }
  .gate { display: inline-block; font-weight: 700; font-size: 12pt; padding: 6px 14px; border-radius: 999px; margin-bottom: 12px; }
  .gate.aprovado { background: var(--ok-bg); color: var(--ok); }
  .gate.reprovado { background: var(--bad-bg); color: var(--bad); }
  .meta { display: grid; grid-template-columns: 120px 1fr; gap: 3px 12px; font-size: 9.5pt; }
  .meta dt { color: var(--muted); }
  .meta dd { margin: 0; overflow-wrap: anywhere; }
  .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(118px, 1fr)); gap: 8px; margin: 12px 0; }
  .kpi { border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; break-inside: avoid; }
  .kpi-value { font-size: 16pt; font-weight: 700; font-variant-numeric: tabular-nums; }
  .kpi-label { color: var(--muted); font-size: 8.5pt; }
  .kpi.ok .kpi-value { color: var(--ok); } .kpi.bad .kpi-value { color: var(--bad); } .kpi.warn .kpi-value { color: var(--warn); }
  ul.summary { margin: 6px 0; padding-left: 18px; } ul.summary li { margin: 3px 0; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; font-size: 9.5pt; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  th { text-align: left; background: var(--soft); font-weight: 600; }
  th, td { border-bottom: 1px solid var(--line); padding: 5px 7px; vertical-align: top; }
  table.compact th, table.compact td { padding: 3px 6px; font-size: 8.8pt; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .center { text-align: center; }
  .ok { color: var(--ok); } .bad { color: var(--bad); font-weight: 700; } .warn { color: var(--warn); font-weight: 700; }
  .muted { color: var(--muted); font-size: 8.5pt; }
  .error { color: var(--bad); font: 8.3pt ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere; }
  .badge { display: inline-block; padding: 1px 7px; border-radius: 999px; font-size: 8.3pt; font-weight: 600; white-space: nowrap; }
  .badge.passed { background: var(--ok-bg); color: var(--ok); } .badge.failed { background: var(--bad-bg); color: var(--bad); }
  .badge.skipped { background: var(--soft); color: var(--muted); } .badge.expected { background: var(--warn-bg); color: var(--warn); }
  .matrix .tick { color: var(--ok); font-weight: 700; } .matrix .cross { color: var(--bad); font-weight: 700; }
  tr.group td { background: var(--soft); font-weight: 600; font-size: 8.8pt; }
  tr.total td { font-weight: 700; border-top: 2px solid var(--line); }
  .flow { display: flex; align-items: center; gap: 6px; margin: 10px 0; break-inside: avoid; }
  .parallel { display: grid; gap: 6px; flex: 3; }
  .row { display: flex; align-items: center; gap: 6px; }
  .stage { border: 1px solid var(--line); border-left: 4px solid var(--accent); border-radius: 6px; padding: 6px 8px; flex: 1; background: #fff; }
  .stage.muted { border-left-color: var(--warn); }
  .stage-title { font-weight: 700; font-size: 9pt; }
  .stage-item { font-size: 8.3pt; color: var(--muted); }
  .arrow { color: var(--muted); font-size: 14pt; }
  .note { color: var(--muted); font-size: 9pt; }
  .empty { color: var(--ok); }
  .callout { border: 1px solid var(--line); border-left: 4px solid var(--warn); border-radius: 6px; padding: 8px 12px; background: var(--soft); break-inside: avoid; }
  .page-break { break-before: page; }
</style>
</head>
<body>

<section class="cover">
  <h1>Relatório do Pipeline de Qualidade</h1>
  <div class="subtitle">Testes automatizados de API, E2E, mobile e performance · Portfólio de Quality Engineering</div>
  <div class="gate ${gate}">Quality gate: ${gate}</div>
  <dl class="meta">${meta.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
</section>

<h2>1. Resumo executivo</h2>
<div class="kpis">
  ${kpi(totals.scenarios, "cenários funcionais")}
  ${kpi(totals.passed, "aprovados", "ok")}
  ${kpi(totals.failed, "falhas inesperadas", totals.failed ? "bad" : "ok")}
  ${kpi(totals.expectedFailures, "falhas esperadas (@bug)", "warn")}
  ${kpi(percent(totals.passed, totals.scenarios - totals.skipped), "taxa de sucesso")}
  ${kpi(totals.evidence, "prints de evidência")}
</div>
${executiveSummary()}

<h2>2. Como o pipeline funciona</h2>
<p>O workflow <code>.github/workflows/ci.yml</code> roda a cada <strong>push</strong> (qualquer branch), em <strong>pull requests</strong>,
diariamente às 06:00 (para detectar mudanças nas aplicações públicas) e sob demanda. Um commit novo na mesma branch cancela a
execução anterior (<code>concurrency</code>).</p>
${pipelineDiagram()}
<ul class="summary">
  <li><strong>Falha rápida e barata:</strong> o estágio de qualidade (lint, tipos, compilação e validação do script k6) roda antes de qualquer teste.</li>
  <li><strong>Paralelismo:</strong> API, E2E e mobile rodam ao mesmo tempo; Playwright usa uma matriz com um job por navegador e dispositivo.</li>
  <li><strong>Reaproveitamento:</strong> três workflows reutilizáveis (Cypress, Rest Assured e Playwright) e uma action composta para projetos Node evitam passos duplicados.</li>
  <li><strong>Cache:</strong> dependências npm e Maven, binário do Cypress e navegadores do Playwright.</li>
  <li><strong>Dependência lógica:</strong> a performance só roda se os testes funcionais de API passarem.</li>
  <li><strong>Defeitos conhecidos:</strong> os cenários <code>@bug</code> rodam em jobs separados e não bloqueantes, gerando evidências sem esconder regressões reais.</li>
  <li><strong>Segurança:</strong> credenciais via <code>secrets</code>, URLs via <code>vars</code>, permissão mínima (<code>contents: read</code>) e entradas passadas por variável de ambiente.</li>
  <li><strong>Rastreabilidade:</strong> cada job publica relatórios e evidências como artefato; o job final gera este relatório em Markdown, HTML e PDF e aplica o quality gate.</li>
</ul>

<h2>3. Resultado por job</h2>
${jobsTable()}

<h2>4. Resultado por camada</h2>
${LAYERS.map((layer) => {
  const list = blockingSuites.filter((s) => s.layer === layer);
  return list.length ? `<h3>${layer}</h3>${suiteOverviewTable(list)}` : "";
}).join("")}
<p class="note">* Tempo somado dos cenários; com execução paralela o tempo real do job é menor.</p>

<h2 class="page-break">5. Detalhe das execuções</h2>
<h3>5.1 E2E e Mobile com Playwright: matriz de navegadores e dispositivos</h3>
${crossBrowserMatrix()}
${detailSuites
  .map(
    (s, i) =>
      `<h3>5.${i + 2} ${escapeHtml(s.layer)} · ${escapeHtml(suiteLabel(s))} (${escapeHtml(s.app)})</h3>${scenarioTable(s)}`,
  )
  .join("")}
<h3>5.${detailSuites.length + 2} Performance · k6</h3>
${performanceSection()}

<h2>6. Falhas inesperadas</h2>
${failuresTable(unexpected, "Nenhuma falha inesperada nesta execução.")}

<h2>7. Falhas esperadas: defeitos conhecidos (@bug)</h2>
<p>Estes cenários verificam o comportamento <strong>correto</strong> e falham enquanto as aplicações não forem corrigidas. A falha
confirma que o defeito continua presente; os relatórios de cada suíte trazem o print ou o request/response do momento da falha.</p>
${failuresTable(expected, "Nenhum cenário @bug executado.")}
${
  bugsPassing.length
    ? `<div class="callout"><strong>Atenção:</strong> ${bugsPassing.length} cenário(s) @bug passaram. O defeito pode ter sido corrigido; revise e remova a tag:
       ${bugsPassing.map(({ c }) => escapeHtml(c.name)).join("; ")}.</div>`
    : ""
}
${knownBugSuites.map((s) => (s.cases.length ? `<h3>${escapeHtml(s.app)} · ${escapeHtml(s.tool)}</h3>${scenarioTable(s)}` : "")).join("")}

<h2>8. Mobile: cobertura atual e próximo passo</h2>
<p>O estágio mobile executa a suíte E2E do SauceDemo emulando dispositivos reais no Playwright: <strong>Pixel 7</strong> (Android, Chrome)
e <strong>iPhone 15</strong> (iOS, Safari/WebKit), com viewport, densidade de pixels, user agent e eventos de toque de cada aparelho.
Isso cobre a experiência <strong>web mobile</strong>.</p>
<div class="callout">O portfólio não tem um aplicativo nativo. Quando houver, o estágio mobile recebe um job com
<strong>Appium</strong> (ou Maestro) em um emulador Android (<code>reactivecircus/android-emulator-runner</code>) e, para iOS, um runner
<code>macos-latest</code> com simulador, ou um device farm (BrowserStack, Sauce Labs, AWS Device Farm). Ele entra na mesma matriz e
publica os resultados como artefato <code>results-mobile-*</code>, que este relatório já consolida.</div>

<h2>9. Artefatos da execução</h2>
<table class="compact">
  <thead><tr><th>Artefato</th><th>Conteúdo</th></tr></thead>
  <tbody>
    <tr><td><code>pipeline-report-&lt;n&gt;</code></td><td>Este relatório (HTML e PDF), o resumo em Markdown e os dados consolidados (JSON)</td></tr>
    <tr><td><code>results-api-cypress</code></td><td>Relatório Cucumber HTML com request/response anexados</td></tr>
    <tr><td><code>results-api-rest-assured</code></td><td>Relatório Allure, Cucumber HTML e JUnit (Surefire)</td></tr>
    <tr><td><code>results-e2e-cypress</code></td><td>Relatório Cucumber HTML com prints de cada validação</td></tr>
    <tr><td><code>results-e2e-playwright-*</code>, <code>results-mobile-*</code></td><td>Relatório Playwright e Cucumber; trace, vídeo e print das falhas</td></tr>
    <tr><td><code>results-performance-k6</code></td><td>Resumo HTML/JSON e dashboard do k6</td></tr>
    <tr><td><code>results-known-bugs-*</code></td><td>Evidências das falhas esperadas</td></tr>
  </tbody>
</table>

</body>
</html>
`;
}

// ---------------------------------------------------------------------------

fs.mkdirSync(OUTPUT, { recursive: true });
fs.writeFileSync(path.join(OUTPUT, "summary.md"), buildMarkdown());
fs.writeFileSync(path.join(OUTPUT, "report.html"), buildHtml());
fs.writeFileSync(
  path.join(OUTPUT, "results.json"),
  JSON.stringify({ run, gate, totals, jobs, suites }, null, 2),
);
fs.writeFileSync(path.join(OUTPUT, "gate.txt"), gate);

console.log(`Quality gate: ${gate}`);
console.log(
  `Cenários funcionais: ${totals.passed}/${totals.scenarios} aprovados, ${totals.failed} falhas inesperadas.`,
);
console.log(`Falhas esperadas (@bug): ${totals.expectedFailures}.`);
console.log(`Relatório: ${path.join(OUTPUT, "report.html")}`);
