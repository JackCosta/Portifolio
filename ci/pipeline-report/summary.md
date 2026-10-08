# Pipeline de Qualidade: ✅ aprovado

**230/230** cenários funcionais executados passaram (100.0%); 1 ignorado(s). Falhas inesperadas: **0**. Falhas esperadas (@bug): **21**.

| Camada | Suíte | Aplicação | Resultado | Total | ✅ | ❌ | ⏭️ |
| --- | --- | --- | --- | --: | --: | --: | --: |
| API | Cypress + Cucumber | Restful-Booker | ✅ passou | 50 | 50 | 0 | 0 |
| API | Java 21 + Rest Assured + Cucumber | Restful-Booker | ✅ passou | 32 | 31 | 0 | 1 |
| E2E | Cypress + Cucumber · Electron | SauceDemo | ✅ passou | 29 | 29 | 0 | 0 |
| E2E | Playwright + playwright-bdd (TypeScript) · Chromium | SauceDemo | ✅ passou | 24 | 24 | 0 | 0 |
| E2E | Playwright + playwright-bdd (TypeScript) · Firefox | SauceDemo | ✅ passou | 24 | 24 | 0 | 0 |
| E2E | Playwright + playwright-bdd (TypeScript) · WebKit | SauceDemo | ✅ passou | 24 | 24 | 0 | 0 |
| Mobile | Playwright + playwright-bdd (TypeScript) · Android · Pixel 7 | SauceDemo | ✅ passou | 24 | 24 | 0 | 0 |
| Mobile | Playwright + playwright-bdd (TypeScript) · iOS · iPhone 15 | SauceDemo | ✅ passou | 24 | 24 | 0 | 0 |
| Performance | k6 | Restful-Booker | ✅ passou | 8 | 8 | 0 | 0 |

**Performance (k6 smoke):** 30 requisições, erro 0.00%, p95 427 ms, thresholds 8/8 ok.

### 🐞 Falhas esperadas (defeitos conhecidos)

| Aplicação | Cenário | Erro registrado |
| --- | --- | --- |
| Restful-Booker | [BUG] Criar reserva sem o campo obrigatório firstname deveria retornar 400 | status code: expected 500 to equal 400 |
| Restful-Booker | [BUG] Criar reserva sem o campo obrigatório lastname deveria retornar 400 | status code: expected 500 to equal 400 |
| Restful-Booker | [BUG] Criar reserva sem o campo obrigatório totalprice deveria retornar 400 | status code: expected 500 to equal 400 |
| Restful-Booker | [BUG] Criar reserva sem o campo obrigatório depositpaid deveria retornar 400 | status code: expected 500 to equal 400 |
| Restful-Booker | [BUG] Criar reserva sem o campo obrigatório bookingdates deveria retornar 400 | status code: expected 500 to equal 400 |
| Restful-Booker | [BUG] Criar reserva sem o campo obrigatório bookingdates.checkin deveria retornar 400 | status code: expected 500 to equal 400 |
| Restful-Booker | [BUG] Criar reserva sem o campo obrigatório bookingdates.checkout deveria retornar 400 | status code: expected 500 to equal 400 |
| Restful-Booker | [BUG] Criar reserva com corpo vazio deveria retornar 400 | status code: expected 500 to equal 400 |
| Restful-Booker | [BUG] Criar reserva com firstname de tipo inválido deveria retornar 400 | status code: expected 500 to equal 400 |
| Restful-Booker | [BUG] Excluir reserva inexistente deveria retornar 404 | status code: expected 405 to equal 404 |
| Restful-Booker | [BUG] Filtro com data em formato inválido deveria retornar 400 | status code: expected 500 to equal 400 |
| Restful-Booker | [BUG] Filtro de checkin deveria incluir a data informada (>=) | expected [] to include 3604 |
| Restful-Booker | [BUG] Filtro de checkout deveria retornar checkouts posteriores à data informada (>=) | expected [ Array(2447) ] to include 3624 |
| Restful-Booker | [BUG] Resposta XML deveria ter content-type application/xml | content-type: expected 'text/html; charset=utf-8' to include 'application/xml' |
| Restful-Booker | [BUG] Atualizar reserva inexistente deveria retornar 404 | status code: expected 405 to equal 404 |
| Restful-Booker | Credenciais inválidas deveriam retornar 401 Unauthorized | [status code] expected: 401 but was: 200 |
| SauceDemo | [BUG] Checkout não deveria ser permitido com o carrinho vazio | Timed out retrying after 10000ms: expected '<button#checkout.btn.btn_action.btn_medium.checkout_button.>' to be 'disabled' |
| SauceDemo | [BUG] Não deveria avançar no checkout com campos com apenas espaços | Timed out retrying after 10000ms: expected '/checkout-step-two.html' to equal '/checkout-step-one.html' |
| SauceDemo | [BUG] Não deveria avançar no checkout com CEP com caracteres especiais | Timed out retrying after 10000ms: expected '/checkout-step-two.html' to equal '/checkout-step-one.html' |
| SauceDemo | [BUG] problem_user deveria concluir uma compra com dados válidos | Timed out retrying after 10000ms: expected '<input#first-name.input_error.form_input>' to have value 'Maria', but the value was 'a' |
| SauceDemo | [BUG] error_user deveria concluir uma compra com dados válidos | The following error originated from your application code, not from Cypress. > Cannot read properties of undefined (reading 'value') When Cypress detects uncaught errors originating from your application it will automat… |

### Jobs

| Job | Bloqueante | Resultado |
| --- | --- | --- |
| Qualidade (lint, tipos, compilação) | sim | ✅ sucesso |
| API · Cypress | sim | ✅ sucesso |
| API · Rest Assured | sim | ✅ sucesso |
| E2E · Cypress | sim | ✅ sucesso |
| E2E · Playwright (3 navegadores) | sim | ✅ sucesso |
| Mobile · Playwright (2 dispositivos) | sim | ✅ sucesso |
| Performance · k6 | sim | ✅ sucesso |
| Defeitos conhecidos · API Cypress | não | ✅ sucesso |
| Defeitos conhecidos · API Rest Assured | não | ✅ sucesso |
| Defeitos conhecidos · E2E Cypress | não | ✅ sucesso |

O relatório detalhado (HTML e PDF) está no artefato `pipeline-report`.
