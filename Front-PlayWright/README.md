# SauceDemo – Testes E2E de Login e Navegação com Playwright + BDD

Testes automatizados de front-end do [SauceDemo](https://www.saucedemo.com/) usando **Playwright**, **BDD
(Gherkin em português via [playwright-bdd](https://github.com/vitalets/playwright-bdd))**, **Page Objects** em
TypeScript, relatórios HTML e pipeline de CI/CD no GitHub Actions.

O fluxo principal faz login e navega até o **formulário de dados do comprador** (`/checkout-step-one.html`),
validando cada etapa da navegação com asserções.

## Stack

| Item       | Ferramenta                                                          |
| ---------- | ------------------------------------------------------------------- |
| Runner     | Playwright Test 1.63 (Chromium, Firefox, WebKit e Pixel 7)          |
| BDD        | playwright-bdd 9 (features em Gherkin `# language: pt`)             |
| Linguagem  | TypeScript (strict)                                                 |
| Qualidade  | ESLint (typescript-eslint + eslint-plugin-playwright) e Prettier    |
| Relatórios | Playwright HTML, Cucumber HTML/JSON, JUnit XML                      |
| CI/CD      | GitHub Actions (lint → matriz de navegadores → relatório unificado) |

## Estrutura

```
features/
├── login.feature                       # Login: fluxos positivos e negativos
└── navigation.feature                  # Login → produtos → carrinho → formulário do comprador
src/
├── pages/                              # Page Objects: locators, ações e asserções de cada tela
│   ├── BasePage.ts                     # open() e expectUrl() comuns
│   ├── components/Header.ts            # Cabeçalho: título, carrinho, menu e logout
│   ├── LoginPage.ts  InventoryPage.ts  CartPage.ts
│   └── CheckoutInformationPage.ts  CheckoutOverviewPage.ts
├── steps/                              # Step definitions (apenas orquestram os Page Objects)
│   ├── login.steps.ts
│   └── navigation.steps.ts
├── data/users.ts                       # Massa de dados: credenciais inválidas, mensagens, comprador
└── support/
    ├── env.ts                          # BASE_URL e credenciais via variáveis de ambiente
    └── fixtures.ts                     # Page Objects injetados como fixtures + createBdd()
playwright.config.ts                    # Projetos, reporters, trace/vídeo/screenshot em falhas
.github/workflows/e2e.yml               # Pipeline de CI/CD
```

### Boas práticas aplicadas

- **Page Objects como fixtures do Playwright.** Os passos recebem `loginPage`, `inventoryPage` etc. já
  instanciados, sem `new` espalhado pelos steps.
- **Seletores `data-test`** via `getByTestId` (`testIdAttribute: "data-test"`) e `getByRole` quando há papel
  acessível.
- **Asserções web-first** (`expect(locator).toHaveText(...)`) com retentativa automática. Nenhum `waitForTimeout`
  (proibido pelo ESLint).
- **Massa de dados separada** em `src/data` e credenciais vindas de variáveis de ambiente (`.env` ou secrets do CI).
- **Passo sem implementação quebra a geração** (`missingSteps: "fail-on-gen"`), então o CI detecta feature
  desatualizada antes de rodar.
- **Evidências em falhas**: screenshot, vídeo e trace (`npx playwright show-trace <arquivo>`).

## Cenários

### Login (`@login`)

| Tipo     | Cenário                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------- |
| Positivo | Tela de login exibida corretamente (título, campos, placeholders, botão)                                  |
| Positivo | Login válido: redireciona a `/inventory.html`, título "Products", 6 produtos, cookie de sessão do usuário |
| Positivo | Login submetendo com a tecla Enter                                                                        |
| Positivo | Logout volta à tela de login e remove o cookie de sessão                                                  |
| Negativo | Usuário e senha em branco, usuário em branco, senha em branco (campos obrigatórios)                       |
| Negativo | Senha incorreta, usuário inexistente, caixa alta, espaços, injeção de SQL                                 |
| Negativo | Usuário bloqueado (`locked_out_user`)                                                                     |
| Negativo | Fechar a mensagem de erro remove a mensagem e os ícones                                                   |
| Negativo | Acesso direto a `/inventory.html`, `/cart.html` e `/checkout-step-one.html` sem login é bloqueado         |

Todos os negativos validam a mensagem exata, o destaque dos campos e que o usuário permanece na tela de login.

### Navegação até o formulário (`@navigation`)

| Tipo     | Cenário                                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------- |
| Positivo | Login → adicionar 2 produtos (badge = 2) → carrinho (itens conferidos) → checkout → formulário exibido vazio e editável |
| Positivo | Preencher o formulário com dados válidos avança para a revisão do pedido com o produto correto                          |
| Negativo | Nome, sobrenome, CEP ou todos em branco: mensagem de erro e permanece no formulário                                     |

## Como executar

Pré-requisito: Node.js 20+.

```bash
npm ci
npx playwright install --with-deps   # navegadores
cp .env.example .env                 # opcional
```

| Comando                   | O que faz                                                    |
| ------------------------- | ------------------------------------------------------------ |
| `npm test`                | Gera os specs a partir das features e roda tudo (4 projetos) |
| `npm run test:chromium`   | Só Chromium (mais rápido no dia a dia)                       |
| `npm run test:smoke`      | Cenários `@smoke`                                            |
| `npm run test:positive`   | Cenários `@positive`                                         |
| `npm run test:negative`   | Cenários `@negative`                                         |
| `npm run test:login`      | Feature de login                                             |
| `npm run test:navigation` | Feature de navegação até o formulário                        |
| `npm run test:headed`     | Chromium com o navegador visível                             |
| `npm run test:ui`         | Modo UI do Playwright (debug interativo)                     |
| `npm run report`          | Abre o relatório HTML do Playwright                          |
| `npm run report:cucumber` | Abre o relatório HTML do Cucumber                            |
| `npm run lint` / `format` | ESLint / Prettier                                            |

Para filtrar por navegador e tag ao mesmo tempo: `npx bddgen && npx playwright test --project=firefox --grep @negative`.

### Variáveis de ambiente

| Variável         | Padrão                      |
| ---------------- | --------------------------- |
| `BASE_URL`       | `https://www.saucedemo.com` |
| `LOGIN_USERNAME` | `standard_user`             |
| `LOGIN_PASSWORD` | `secret_sauce`              |

## Relatórios

| Relatório       | Local                                                                  |
| --------------- | ---------------------------------------------------------------------- |
| Playwright HTML | `reports/playwright/index.html` (passos BDD, trace, vídeo, screenshot) |
| Cucumber HTML   | `reports/cucumber/index.html`                                          |
| Cucumber JSON   | `reports/cucumber/report.json`                                         |
| JUnit XML       | `reports/junit/results.xml`                                            |

## CI/CD (GitHub Actions)

`.github/workflows/e2e.yml` roda em push na `main`, em pull requests, diariamente às 06:00 (BRT) e manualmente
(com filtro de tags e URL base opcionais).

1. **Lint, tipos e Gherkin**: `tsc`, ESLint sem avisos, Prettier e `bddgen` (falha se faltar step).
2. **E2E**: matriz paralela com Chromium, Firefox, WebKit e Mobile Chrome. Usa cache dos navegadores e 2
   retentativas. Cada job publica relatórios, traces, vídeos e screenshots como artefatos.
3. **Relatório unificado**: une os resultados de todos os navegadores em um único relatório HTML (artefato
   `playwright-report-<n>`) e escreve o resumo na página da execução.

Credenciais podem ser sobrescritas pelos secrets `LOGIN_USERNAME` e `LOGIN_PASSWORD`.
