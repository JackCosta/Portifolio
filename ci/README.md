# Pipeline de CI/CD

O pipeline único do portfólio fica em [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). Ele executa os testes
de **API, E2E, mobile e performance** a cada commit e gera um relatório consolidado em Markdown, HTML e PDF.

## Gatilhos

| Evento              | Quando                                                                          |
| ------------------- | ------------------------------------------------------------------------------- |
| `push`              | Todo commit, em qualquer branch                                                 |
| `pull_request`      | Todo pull request                                                               |
| `schedule`          | Diariamente às 06:00 (BRT), para detectar mudanças nas aplicações públicas      |
| `workflow_dispatch` | Manual: escolhe o perfil do k6 (`smoke` ou `load`) e se roda os defeitos `@bug` |

Um commit novo na mesma branch cancela a execução anterior (`concurrency`).

## Estágios

```
               ┌─► API (Cypress, Rest Assured) ────► Performance (k6) ─┐
 Qualidade ────┼─► E2E (Cypress, Playwright ×3) ───────────────────────┤
 (matriz ×5)   ├─► Mobile (Pixel 7, iPhone 15) ────────────────────────┼─► Relatório + quality gate
               └─► Defeitos conhecidos (@bug, não bloqueantes) ────────┘
```

| Estágio                | Job(s)                                                             | Bloqueia? |
| ---------------------- | ------------------------------------------------------------------ | --------- |
| 1. Qualidade           | Lint, Prettier, TypeScript, compilação Java e `k6 inspect`         | Sim       |
| 2. API                 | Back-Cypress e Back-Rest-Assured                                   | Sim       |
| 2. E2E                 | Front-Cypress e Front-PlayWright (Chromium, Firefox e WebKit)      | Sim       |
| 2. Mobile              | Front-PlayWright em Pixel 7 (Android) e iPhone 15 (iOS)            | Sim       |
| 2. Defeitos conhecidos | Cenários `@bug` de Back-Cypress, Back-Rest-Assured e Front-Cypress | Não       |
| 3. Performance         | k6: `smoke` a cada commit, `load` (500 VUs) sob demanda            | Sim       |
| 4. Relatório           | Consolida tudo, gera HTML/PDF e aplica o quality gate              | -         |

## Arquivos

| Arquivo                                         | Papel                                                          |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `.github/workflows/ci.yml`                      | Orquestra os estágios                                          |
| `.github/workflows/cypress-tests.yml`           | Workflow reutilizável dos projetos Cypress (API, E2E e `@bug`) |
| `.github/workflows/rest-assured-tests.yml`      | Workflow reutilizável do projeto Java                          |
| `.github/workflows/playwright-tests.yml`        | Workflow reutilizável do Playwright, com matriz de navegadores |
| `.github/actions/setup-node-project/action.yml` | Action composta: Node, cache do npm e do Cypress, `npm ci`     |
| `ci/consolidate-report.mjs`                     | Lê os resultados de todos os jobs e gera o relatório e o gate  |
| `ci/html-to-pdf.mjs`                            | Converte o relatório HTML em PDF (Chromium do Playwright)      |
| `ci/run-local.sh`                               | Executa o pipeline inteiro localmente, com os mesmos comandos  |

## Relatório

Cada job publica os próprios relatórios como artefato `results-<suíte>`. O job final baixa todos e o
`consolidate-report.mjs` lê:

- **Cucumber JSON** dos projetos Cypress;
- **JUnit XML** do Rest Assured (Surefire) e do Playwright;
- **resumo JSON** do k6.

Ele gera, no artefato `pipeline-report-<n>`:

- `summary.md`: também publicado na página da execução (`$GITHUB_STEP_SUMMARY`);
- `report.html` e `relatorio-pipeline.pdf`: relatório detalhado;
- `results.json`: dados consolidados;
- `gate.txt`: `aprovado` ou `reprovado`.

O **quality gate** reprova o pipeline se qualquer job bloqueante não terminar com sucesso. Os defeitos conhecidos
não entram no gate. Se um cenário `@bug` passar, o relatório avisa que o defeito pode ter sido corrigido.

## Configuração no GitHub

Nada é obrigatório: sem configuração, o pipeline usa as URLs e credenciais públicas das aplicações de prática.

- **Secrets** (opcionais): `AUTH_USERNAME` e `AUTH_PASSWORD` (Restful-Booker), `LOGIN_USERNAME` e `LOGIN_PASSWORD`
  (SauceDemo).
- **Variables** (opcionais): `RESTFUL_BOOKER_URL` e `SAUCEDEMO_URL`, para apontar para outro ambiente.

## Execução local

```bash
cd ci && npm install      # uma vez
bash ci/run-local.sh      # a partir da raiz do repositório
```

O script segue a mesma ordem e os mesmos comandos do CI e gera o relatório em `ci/pipeline-report/`. Ele exige
Node 22, Java 21, k6 e as dependências de cada projeto instaladas.

## Mobile nativo

O estágio mobile cobre a experiência **web mobile** emulando o Pixel 7 e o iPhone 15. O portfólio não tem um app
nativo. Quando houver, basta um job com Appium (ou Maestro) em emulador Android
(`reactivecircus/android-emulator-runner`) ou em simulador iOS (`macos-latest`), publicando o resultado como
`results-mobile-<dispositivo>`, que o relatório já consolida.
