# Restful Booker — Testes de API com Cypress + BDD

Testes automatizados da API [Restful Booker](https://restful-booker.herokuapp.com) escritos em **Cypress**, com
**BDD (Cucumber/Gherkin em português)** e **Page Objects**.


## Stack

| Ferramenta                              | Uso                                                 |
| --------------------------------------- | --------------------------------------------------- |
| Cypress 16                              | Runner e cliente HTTP (`cy.request`)                |
| @badeball/cypress-cucumber-preprocessor | BDD com Gherkin, tags, relatório HTML/JSON e anexos |
| multiple-cucumber-html-reporter         | Relatório detalhado com dashboard e gráficos        |
| Ajv                                     | Validação de contrato (JSON Schema)                 |
| ESLint + Prettier                       | Padronização de código                              |
| GitHub Actions                          | Execução em CI com publicação dos relatórios        |

## Estrutura

```
.
├── cypress/
│   ├── e2e/
│   │   ├── features/
│   │   │   ├── auth/auth.feature                  # POST /auth
│   │   │   └── booking/
│   │   │       ├── get_booking.feature            # GET /booking e /booking/:id
│   │   │       ├── create_booking.feature         # POST /booking
│   │   │       ├── update_booking.feature         # PUT /booking/:id
│   │   │       ├── delete_booking.feature         # DELETE /booking/:id
│   │   │       └── invalid_methods.feature        # Métodos não suportados / OPTIONS
│   │   └── step_definitions/
│   │       ├── auth.steps.js
│   │       ├── booking.steps.js
│   │       ├── common.steps.js                    # Status, headers, contrato, tempo, requisição genérica
│   │       └── hooks.js                           # Limpeza das reservas criadas (After)
│   ├── fixtures/auth.json                         # Massa de credenciais inválidas
│   └── support/
│       ├── pages/                                 # Page Objects da API
│       │   ├── BasePage.js                        # Requisição base + anexo de request/response no relatório
│       │   ├── AuthPage.js
│       │   └── BookingPage.js
│       ├── schemas/                               # Contratos JSON Schema (index.js = registro por nome)
│       ├── utils/
│       │   ├── authHeaders.js                     # Cookie token / Basic / inválidos / sem autenticação
│       │   ├── bookingFactory.js                  # Payloads únicos, remoção de campos, datas
│       │   ├── createdBookings.js                 # Registro de reservas para limpeza
│       │   └── schemaValidator.js
│       ├── commands.js                            # cy.validateSchema()
│       └── e2e.js
├── scripts/generate-report.js                     # Relatório HTML detalhado
├── .github/workflows/api-tests.yml
└── cypress.config.js
```

### Camadas

- **Features:** comportamento em linguagem de negócio, um arquivo por método HTTP.
- **Step definitions:** traduzem os passos em chamadas aos Page Objects e asserções. Os passos compartilham estado
  por aliases do Cypress (`@response`, `@booking`, `@bookingId`, `@updatedBooking`).
- **Page Objects:** concentram URL, método e headers de cada endpoint. Toda requisição feita por eles é anexada
  ao relatório, com headers sensíveis mascarados.
- **Massa de dados:** cada cenário cria a própria reserva com nomes únicos. O hook `After` remove o que foi criado.


### Defeitos encontrados na API (`@bug`)

Os cenários com a tag `@bug` verificam o comportamento **correto** e falham enquanto a API não for corrigida. Eles
ficam fora da execução padrão (`npm test`) para que a suíte continue estável. Para executá-los, use
`npm run test:bugs` ou `npm run test:all`.

| #   | Endpoint                                         | Esperado                        | Atual                       |
| --- | ------------------------------------------------ | ------------------------------- | --------------------------- |
| 1   | `POST /booking` sem campo obrigatório (7 casos)  | `400 Bad Request`               | `500 Internal Server Error` |
| 2   | `POST /booking` com corpo vazio                  | `400`                           | `500`                       |
| 3   | `POST /booking` com tipos inválidos (4 casos)    | `400`                           | `500`                       |
| 4   | `GET /booking?checkin=data-invalida`             | `400`                           | `500`                       |
| 5   | `GET /booking?checkin=X`                         | Checkins `>= X` (documentação)  | Apenas checkins `> X`       |
| 6   | `GET /booking?checkout=X`                        | Checkouts `>= X` (documentação) | Checkouts `<= X`            |
| 7   | `GET /booking/:id` com `Accept: application/xml` | `content-type: application/xml` | `text/html`                 |
| 8   | `PUT /booking/:id` inexistente                   | `404`                           | `405 Method Not Allowed`    |
| 9   | `DELETE /booking/:id` inexistente ou já excluído | `404`                           | `405 Method Not Allowed`    |

Outros comportamentos da API que os testes tratam como o esperado atual (não marcados como `@bug`):

- Credenciais inválidas em `POST /auth` retornam `200` com `{"reason":"Bad credentials"}`.
- `DELETE` bem-sucedido retorna `201 Created`, conforme a documentação.
- Rotas ou métodos inexistentes retornam `404` (e não `405`).
- `Accept` não suportado no `POST /booking` retorna `418 I'm a Teapot`.

## Como executar

Pré-requisito: Node.js 20+.

```bash
npm install

npm test                  # suíte estável (tudo, exceto @bug)
npm run test:all          # tudo, incluindo os defeitos conhecidos
npm run cy:open           # modo interativo

# Por grupo
npm run test:smoke | test:regression | test:negative | test:contract | test:bugs
npm run test:auth  | test:get | test:post | test:put | test:delete

# Expressão de tags livre
npx cypress run --expose tags="@booking and @negative and not @bug"
```

> Se o Cypress não abrir quando executado pelo terminal integrado do VS Code (erro `bad option: --smoke-test`),
> rode `unset ELECTRON_RUN_AS_NODE` antes dos comandos.

## Relatórios

Cada execução gera três saídas em `reports/`:

| Arquivo                             | Conteúdo                                                                                        |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `reports/html/index.html`           | **Relatório detalhado:** dashboard com gráficos, totais por feature e cenário, passos e duração |
| `reports/cucumber-report.html`      | Relatório nativo do Cucumber, com filtros por tag e status                                      |
| `reports/json/cucumber-report.json` | Dados brutos para integração com outras ferramentas                                             |

Nos dois relatórios HTML, cada passo que faz uma requisição traz um anexo com método, URL, headers (credenciais
mascaradas), corpo enviado, status, `content-type`, duração e corpo da resposta.

```bash
npm run report:open       # abre o relatório detalhado
npm run report            # regera o relatório a partir do último JSON
```

No CI, a pasta `reports/` é publicada como artefato do workflow.

O workflow [`api-tests.yml`](.github/workflows/api-tests.yml) roda em push na `main`, em pull requests, diariamente
(06:00 BRT) e manualmente (`workflow_dispatch`, com os inputs `tags` e `base_url`). O job de lint (ESLint + Prettier)
precisa passar antes dos testes.

## Configuração

| Variável               | Tipo                        | Padrão                                 |
| ---------------------- | --------------------------- | -------------------------------------- |
| `BASE_URL`             | variável de ambiente do SO  | `https://restful-booker.herokuapp.com` |
| `AUTH_USERNAME`        | `env` (sensível, `cy.env`)  | `admin`                                |
| `AUTH_PASSWORD`        | `env` (sensível, `cy.env`)  | `password123`                          |
| `MAX_RESPONSE_TIME_MS` | `expose` (`Cypress.expose`) | `3000`                                 |

Para sobrescrever as credenciais localmente, copie `cypress.env.example.json` para `cypress.env.json` (ignorado pelo
git), ou use `CYPRESS_AUTH_USERNAME` / `CYPRESS_AUTH_PASSWORD`. No CI, cadastre os secrets `AUTH_USERNAME` e
`AUTH_PASSWORD`.

## Lint e formatação

```bash
npm run lint
npm run format
```
