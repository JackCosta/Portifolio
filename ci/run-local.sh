#!/usr/bin/env bash
# Executa localmente os mesmos estágios do .github/workflows/ci.yml, na mesma ordem e com os mesmos
# comandos, e gera o relatório consolidado (HTML e PDF). Útil para validar o pipeline antes do push.
#
# Uso: bash ci/run-local.sh        (a partir da raiz do repositório ou de ci/)
#
# Pré-requisitos: Node 22, Java 21, k6 e as dependências de cada projeto instaladas (npm ci / mvnw).
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RESULTS="$ROOT/ci/pipeline-results"
REPORT="$ROOT/ci/pipeline-report"
LOGS="$RESULTS/logs"
STATE="$RESULTS/.jobs"

# O terminal do VS Code exporta ELECTRON_RUN_AS_NODE, que impede o Cypress de abrir.
unset ELECTRON_RUN_AS_NODE

rm -rf "$RESULTS" "$REPORT"
mkdir -p "$LOGS" "$STATE"

PIPELINE_START=$(date +%s)
export PIPELINE_STARTED_AT
PIPELINE_STARTED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)

now_ms() { python3 -c 'import time; print(int(time.time() * 1000))'; }

log() { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }

# Executa um comando dentro de um projeto, gravando o log. Retorna o código de saída do comando.
step() {
  local job="$1" dir="$2"
  shift 2
  echo "  \$ (cd $dir && $*)" | tee -a "$LOGS/$job.log"
  (cd "$ROOT/$dir" && "$@") >>"$LOGS/$job.log" 2>&1
}

# Resultado (success/failure/skipped) e duração de cada job ficam em $STATE (compatível com bash 3.2).
finish_job() {
  local job="$1" status="$2" started="$3" duration
  duration=$(($(now_ms) - started))
  echo "$status" >"$STATE/$job.result"
  echo "$duration" >"$STATE/$job.duration"
  echo "  → $job: $status ($((duration / 1000)) s)"
}

skip_job() {
  echo skipped >"$STATE/$1.result"
  echo "  → $1: skipped (dependência falhou)"
}

job_result() { cat "$STATE/$1.result" 2>/dev/null || echo skipped; }
job_duration() { cat "$STATE/$1.duration" 2>/dev/null || echo null; }

# Copia os resultados de um projeto para o "artefato" results-<suíte>.
collect() {
  local suite="$1"
  shift
  mkdir -p "$RESULTS/results-$suite"
  for source in "$@"; do
    [ -e "$ROOT/$source" ] && cp -R "$ROOT/$source" "$RESULTS/results-$suite/"
  done
  return 0
}

# ---------------------------------------------------------------------------
log "Estágio 1 · Qualidade"
started=$(now_ms)
status=success
step quality Back-Cypress npm run lint || status=failure
step quality Back-Cypress npx prettier --check . || status=failure
step quality Back-Rest-Assured ./mvnw -B -ntp -q test-compile || status=failure
step quality Front-Cypress npm run lint || status=failure
step quality Front-Cypress npx prettier --check . || status=failure
step quality Front-PlayWright npm run typecheck || status=failure
step quality Front-PlayWright npx eslint . --max-warnings=0 || status=failure
step quality Front-PlayWright npm run format:check || status=failure
step quality Front-PlayWright npx bddgen || status=failure
step quality K6 k6 inspect -e PROFILE=smoke src/tests/booking-load.test.js || status=failure
finish_job quality "$status" "$started"

if [ "$(job_result quality)" != success ]; then
  for job in api-cypress api-rest-assured e2e-cypress e2e-playwright mobile performance \
    known-bugs-api-cypress known-bugs-api-rest-assured known-bugs-e2e-cypress; do
    skip_job "$job"
  done
else
  # -------------------------------------------------------------------------
  log "Estágio 2 · API"
  started=$(now_ms)
  status=success
  rm -rf "$ROOT/Back-Cypress/reports"
  step api-cypress Back-Cypress npx cypress run --expose tags="not @bug" || status=failure
  collect api-cypress Back-Cypress/reports
  finish_job api-cypress "$status" "$started"

  started=$(now_ms)
  status=success
  step api-rest-assured Back-Rest-Assured ./mvnw -B -ntp test -Dcucumber.filter.tags="not @bug" || status=failure
  step api-rest-assured Back-Rest-Assured npx --yes allure-commandline@2 generate target/allure-results -o target/allure-report --clean
  collect api-rest-assured Back-Rest-Assured/target/surefire-reports Back-Rest-Assured/target/cucumber-report Back-Rest-Assured/target/allure-report
  finish_job api-rest-assured "$status" "$started"

  # -------------------------------------------------------------------------
  log "Estágio 2 · E2E"
  started=$(now_ms)
  status=success
  rm -rf "$ROOT/Front-Cypress/reports"
  step e2e-cypress Front-Cypress npx cypress run --expose tags="not @bug" || status=failure
  collect e2e-cypress Front-Cypress/reports
  finish_job e2e-cypress "$status" "$started"

  # Playwright: um "job" da matriz por navegador/dispositivo, como no CI.
  run_playwright() {
    local job="$1" suite="$2" project="$3"
    rm -rf "$ROOT/Front-PlayWright/reports" "$ROOT/Front-PlayWright/test-results" "$ROOT/Front-PlayWright/blob-report"
    CI=true step "$job" Front-PlayWright npx playwright test --project="$project"
    local code=$?
    collect "$suite" Front-PlayWright/reports Front-PlayWright/test-results
    return $code
  }

  started=$(now_ms)
  status=success
  run_playwright e2e-playwright e2e-playwright-chromium chromium || status=failure
  run_playwright e2e-playwright e2e-playwright-firefox firefox || status=failure
  run_playwright e2e-playwright e2e-playwright-webkit webkit || status=failure
  finish_job e2e-playwright "$status" "$started"

  # -------------------------------------------------------------------------
  log "Estágio 2 · Mobile"
  started=$(now_ms)
  status=success
  run_playwright mobile mobile-pixel-7 mobile-chrome || status=failure
  run_playwright mobile mobile-iphone-15 mobile-safari || status=failure
  finish_job mobile "$status" "$started"

  # -------------------------------------------------------------------------
  log "Estágio 2 · Defeitos conhecidos (não bloqueantes)"
  started=$(now_ms)
  rm -rf "$ROOT/Back-Cypress/reports"
  step known-bugs-api-cypress Back-Cypress npx cypress run --expose tags="@bug" --config retries=0
  collect known-bugs-api-cypress Back-Cypress/reports
  finish_job known-bugs-api-cypress success "$started"

  started=$(now_ms)
  step known-bugs-api-rest-assured Back-Rest-Assured ./mvnw -B -ntp test -Dcucumber.filter.tags="@bug"
  collect known-bugs-api-rest-assured Back-Rest-Assured/target/surefire-reports Back-Rest-Assured/target/cucumber-report
  finish_job known-bugs-api-rest-assured success "$started"

  started=$(now_ms)
  rm -rf "$ROOT/Front-Cypress/reports"
  step known-bugs-e2e-cypress Front-Cypress npx cypress run --expose tags="@bug" --config retries=0
  collect known-bugs-e2e-cypress Front-Cypress/reports
  finish_job known-bugs-e2e-cypress success "$started"

  # -------------------------------------------------------------------------
  log "Estágio 3 · Performance"
  if [ "$(job_result api-cypress)" = success ] && [ "$(job_result api-rest-assured)" = success ]; then
    started=$(now_ms)
    status=success
    rm -f "$ROOT"/K6/reports/smoke-*
    K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=reports/smoke-dashboard.html \
      step performance K6 k6 run -e PROFILE=smoke src/tests/booking-load.test.js || status=failure
    collect performance-k6 K6/reports/smoke-summary.json K6/reports/smoke-summary.html K6/reports/smoke-dashboard.html
    finish_job performance "$status" "$started"
  else
    skip_job performance
  fi
fi

# ---------------------------------------------------------------------------
log "Estágio 4 · Relatório consolidado"
NEEDS_JSON="{"
for job in quality api-cypress api-rest-assured e2e-cypress e2e-playwright mobile performance \
  known-bugs-api-cypress known-bugs-api-rest-assured known-bugs-e2e-cypress; do
  NEEDS_JSON+="\"$job\":{\"result\":\"$(job_result "$job")\",\"duration_ms\":$(job_duration "$job")},"
done
NEEDS_JSON="${NEEDS_JSON%,}}"

export NEEDS_JSON
export PIPELINE_FINISHED_AT
PIPELINE_FINISHED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
export PIPELINE_WALL_MS=$((($(date +%s) - PIPELINE_START) * 1000))

cd "$ROOT/ci" || exit 1
node consolidate-report.mjs --input pipeline-results --output pipeline-report
node html-to-pdf.mjs pipeline-report/report.html pipeline-report/relatorio-pipeline.pdf

echo
echo "Quality gate: $(cat pipeline-report/gate.txt)"
test "$(cat pipeline-report/gate.txt)" = "aprovado"
