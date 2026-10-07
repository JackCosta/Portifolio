# Restful Booker — Testes de API com Rest Assured + BDD

Testes automatizados do endpoint de autenticação da API [Restful Booker](https://restful-booker.herokuapp.com)
escritos em **Java + Rest Assured**, com **BDD (Cucumber/Gherkin em português)** e **Service Objects**
(o equivalente a Page Objects para APIs).

## Stack

| Ferramenta                       | Uso                                                           |
| -------------------------------- | ------------------------------------------------------------- |
| Java 21 + Maven (wrapper)        | Linguagem e build                                             |
| Rest Assured 5                   | Cliente HTTP                                                  |
| Cucumber 7 + JUnit Platform      | BDD, tags, execução paralela                                  |
| Cucumber PicoContainer           | Injeção de dependência e estado isolado por cenário           |
| AssertJ                          | Asserções                                                     |
| json-schema-validator            | Validação de contrato (JSON Schema)                           |
| Allure + relatório HTML Cucumber | Relatórios com request/response anexados                      |
| GitHub Actions                   | CI: compilação → smoke → regressão, com publicação de relatórios |

## Estrutura

```
.
├── src/test/java/br/com/portifolio/restfulbooker/
│   ├── config/Config.java              # Configuração: -D > variável de ambiente > config.properties
│   ├── context/
│   │   ├── ScenarioContext.java        # Estado do cenário (respostas, id da reserva)
│   │   └── HttpLog.java                # Log HTTP do cenário, anexado ao relatório
│   ├── core/BaseService.java           # Spec base: URL, filtros de log e Allure
│   ├── services/                       # Service Objects (Page Objects da API)
│   │   ├── AuthService.java            # POST /auth
│   │   └── BookingService.java         # Apoio: prova que o token autoriza operações protegidas
│   ├── models/                         # Credentials (request) e AuthResponse (response)
│   ├── data/AuthDataFactory.java       # Massa de credenciais inválidas por nome do caso
│   ├── steps/
│   │   ├── AuthSteps.java
│   │   ├── BookingSteps.java
│   │   ├── CommonSteps.java            # Status, headers, corpo, contrato, tempo de resposta
│   │   └── Hooks.java                  # Anexo do log HTTP e limpeza de reservas
│   └── runners/RunCucumberTest.java    # Suíte JUnit Platform
├── src/test/resources/
│   ├── features/auth/auth.feature
│   ├── schemas/                        # auth-success.json, auth-failure.json
│   ├── testdata/invalid-credentials.json
│   ├── config.properties
│   ├── junit-platform.properties       # Plugins, paralelismo
│   └── allure.properties
└── .github/workflows/api-tests.yml
```

## Cobertura (POST /auth)

| Tipo           | Cenários                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------- |
| Positivos      | Token válido, tokens únicos por chamada, campos extras ignorados, envio como formulário      |
| Headers        | `Content-Type`, `Content-Length` coerente com o corpo, `ETag`, `X-Powered-By`                |
| Contrato       | JSON Schema de sucesso (`token` hexadecimal de 15 caracteres) e de falha (`reason`)          |
| Negativos      | 13 variações de credenciais inválidas (incl. nulos, tipos errados, SQL injection, `[]`)      |
| Negativos      | Content-Type incorreto/ausente, JSON malformado (400), JSON declarado como XML (400)         |
| Negativos      | Métodos não suportados: GET, PUT, PATCH, DELETE (404)                                        |
| Integração     | Token gerado autoriza DELETE /booking (201); token inválido é rejeitado (403)                |
| Bug conhecido  | `@bug`: credenciais inválidas retornam **200** em vez de **401** (excluído por padrão)       |

> A API responde `200 OK` com `{"reason": "Bad credentials"}` para credenciais inválidas. Os testes negativos
> validam esse comportamento real; o cenário `@bug` documenta o comportamento esperado por boas práticas REST.

## Como executar

Pré-requisito: Java 21+ (o Maven é baixado pelo wrapper).

```bash
./mvnw test                                          # tudo, exceto @bug
./mvnw test -Dcucumber.filter.tags="@smoke"          # apenas smoke
./mvnw test -Dcucumber.filter.tags="@negative and not @bug"
./mvnw test -Dcucumber.filter.tags="@bug"            # bugs conhecidos (devem falhar)
```

### Configuração

| Propriedade (`-D`)     | Variável de ambiente    | Padrão                                  |
| ---------------------- | ----------------------- | --------------------------------------- |
| `base.url`             | `BASE_URL`              | `https://restful-booker.herokuapp.com`  |
| `auth.username`        | `AUTH_USERNAME`         | `admin`                                 |
| `auth.password`        | `AUTH_PASSWORD`         | `password123`                           |
| `max.response.time.ms` | `MAX_RESPONSE_TIME_MS`  | `5000`                                  |

### Relatórios

- Cucumber HTML: `target/cucumber-report/cucumber.html`
- Allure: `allure serve target/allure-results` (ou `npx allure-commandline serve target/allure-results`)

Cada cenário traz anexado o tráfego HTTP completo (request e response).

## CI/CD

O workflow [`api-tests.yml`](.github/workflows/api-tests.yml) roda em push na `main`, em pull requests,
diariamente (06:00 BRT) e manualmente (com escolha de tags e URL base):

1. **Compilação** — `test-compile`.
2. **Smoke** — `@smoke`; falha rápido se a API estiver fora do ar.
3. **Regressão** — suíte completa (`not @bug` por padrão), resultado publicado no GitHub Checks,
   relatórios Allure, Cucumber e Surefire enviados como artefato.

Credenciais podem vir dos secrets `AUTH_USERNAME` e `AUTH_PASSWORD`; sem eles, usa os valores públicos da API.
