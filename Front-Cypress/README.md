# SauceDemo – Testes E2E de Login e Checkout com Cypress + BDD

Testes automatizados de front-end do [SauceDemo](https://www.saucedemo.com/) usando **Cypress**, **BDD
(Cucumber/Gherkin em português)** e **Page Objects**, com os seletores separados em arquivos de elementos.

## Estrutura

```
cypress/
├── e2e/
│   ├── features/
│   │   ├── login/login.feature
│   │   └── checkout/checkout.feature
│   └── step_definitions/
│       ├── login.steps.js
│       ├── checkout.steps.js
│       └── hooks.js                        # Prints de evidência anexados ao relatório
├── fixtures/
│   ├── users.json                          # Credenciais inválidas (login)
│   └── customers.json                      # Dados do comprador (checkout)
└── support/
    ├── elements/                           # Somente seletores de cada tela
    ├── pages/                              # Ações e validações (Page Objects)
    │   ├── components/Header.js            # Cabeçalho: título, carrinho, menu
    │   ├── components/CartItemList.js      # Itens do carrinho / revisão do pedido
    │   ├── LoginPage.js  InventoryPage.js  CartPage.js
    │   └── CheckoutInformationPage.js  CheckoutOverviewPage.js  CheckoutCompletePage.js
    └── utils/money.js                      # Conversão e soma de valores em centavos
scripts/generate-report.js                  # Relatório HTML detalhado
```

### Boas práticas aplicadas

- **Seletores `data-test`**, isolados em `support/elements`. Quando a tela muda, só o arquivo de elementos é alterado.
- **Login por `cy.session`** no checkout. A sessão é criada pela interface uma vez e reaproveitada, e cada
  cenário começa com o carrinho vazio.
- **Sem `cy.wait` fixo.** As esperas usam asserções com retentativa automática do Cypress.
- **Dados em fixtures** e credenciais em variáveis de ambiente (`cy.env`), com a senha oculta no log.
- **Valores conferidos de duas formas**: pelo valor exato esperado e pelo cálculo (soma dos itens = subtotal;
  subtotal + taxa = total). A soma é feita em centavos para evitar erro de ponto flutuante.

## Cenários de checkout

Fluxo principal: comprar **Sauce Labs Backpack ($29.99)** e **Sauce Labs Bike Light ($9.99)**.

| Tipo     | Cenário                                                                                                                                                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Positivo | Compra completa: preços na vitrine → adicionar (badge = 2, botão "Remove") → carrinho (nome, qtd, preço) → dados do comprador → revisão (itens, pagamento, entrega, subtotal $39.98, taxa $3.20, total $43.18) → confirmação → carrinho vazio |
| Positivo | Remover um produto no carrinho recalcula o pedido ($29.99 + $2.40 = $32.39)                                                                                                                                                                   |
| Positivo | Cancelar na revisão mantém os produtos no carrinho                                                                                                                                                                                            |
| Negativo | Dados incompletos (nome, sobrenome, CEP ou todos em branco): mensagem de erro, campos destacados, permanece na etapa                                                                                                                          |
| Negativo | Corrigir os dados após o erro permite concluir a compra                                                                                                                                                                                       |
| Negativo | Cancelar na etapa de informações volta ao carrinho sem perder os produtos                                                                                                                                                                     |
| Negativo | Acesso direto a `/cart.html` e às etapas do checkout sem login é bloqueado                                                                                                                                                                    |

> **Cartão e endereço:** o SauceDemo não tem campo de cartão nem de endereço completo. A etapa de informações
> pede apenas Nome, Sobrenome e CEP, e o pagamento é fixo ("SauceCard #31337"). Por isso, "endereço
> incompleto" é coberto pelos campos obrigatórios em branco, e a forma de pagamento é validada na revisão do
> pedido. Não há como testar um número de cartão inválido nesta aplicação.

### Falhas esperadas: defeitos encontrados (`@bug`)

Os cenários `@bug` verificam o comportamento **correto** e falham enquanto o site não for corrigido. Eles
ficam fora de `npm test` para manter a suíte estável e aparecem no relatório com o print do momento da falha.

| #   | Cenário                              | Esperado                        | Atual                                                     |
| --- | ------------------------------------ | ------------------------------- | --------------------------------------------------------- |
| 1   | Checkout com carrinho vazio          | Botão "Checkout" desabilitado   | Habilitado; o pedido vazio pode ser finalizado            |
| 2   | Nome, sobrenome e CEP só com espaços | Mensagem de erro                | Avança para a revisão do pedido                           |
| 3   | CEP `!@#$%`                          | Mensagem de erro                | Avança para a revisão do pedido                           |
| 4   | `problem_user` preenche os dados     | Campos com os valores digitados | Digitar o sobrenome sobrescreve o campo Nome (fica `"a"`) |
| 5   | `error_user` preenche os dados       | Compra concluída                | Erro de JavaScript: `Cannot read properties of undefined` |

## Como executar

```bash
npm install
npm run cy:open         # modo interativo
npm test                # suíte estável (tudo, exceto @bug)
npm run test:all        # tudo, incluindo as falhas esperadas (@bug)
npm run test:bugs       # somente os defeitos conhecidos
npm run test:login | test:checkout | test:smoke | test:positive | test:negative
```

As credenciais ficam em `cypress.config.js` e podem ser sobrescritas com `cypress.env.json` (veja
`cypress.env.example.json`) ou com `CYPRESS_LOGIN_USERNAME` / `CYPRESS_LOGIN_PASSWORD`.

> Rodando pelo terminal integrado do VS Code e recebendo `bad option: --no-sandbox`? Execute
> `unset ELECTRON_RUN_AS_NODE` antes do comando.

## Relatório com evidências

Ao fim de cada execução são gerados:

- `reports/html/index.html`: relatório detalhado, com dashboard, gráficos, features, cenários e passos. Abra
  com `npm run report:open`.
- `reports/cucumber-report.html`: relatório do Cucumber em um único arquivo.

Cada bloco de validações ("Então" + "E") anexa um print da tela ao passo correspondente. Nos cenários com
falha, incluindo os `@bug`, o print do momento da falha e a mensagem de erro também são anexados. Para o
relatório completo, com as falhas esperadas, execute `npm run test:all`.

## Integração contínua (GitHub Actions)

O workflow fica em [`../.github/workflows/front-e2e-tests.yml`](../.github/workflows/front-e2e-tests.yml), na
raiz do repositório, porque o GitHub só lê workflows de lá. Ele roda a partir desta pasta (`Front-Cypress`).

| Gatilho             | Quando                                                       |
| ------------------- | ------------------------------------------------------------ |
| `push` na `main`    | Alterações em `Front-Cypress/**` ou no próprio workflow      |
| `pull_request`      | Mesmos caminhos                                              |
| `schedule`          | Diariamente às 06:00 (BRT), para detectar mudanças no site   |
| `workflow_dispatch` | Manual, com a expressão de tags e a URL base como parâmetros |

Jobs:

1. **Lint e formatação**: ESLint e Prettier.
2. **Testes E2E (suíte estável)**: `not @bug` (ou as tags informadas na execução manual). Reprova o pipeline
   se algum cenário falhar.
3. **Defeitos conhecidos**: roda os cenários `@bug` com `continue-on-error`. Gera o relatório com as falhas
   esperadas sem reprovar o pipeline.

Cada job de teste publica um resumo por cenário na página da execução (`scripts/ci-summary.js`) e envia
`reports/` e `cypress/screenshots/` como artefato, mantido por 14 dias. As credenciais podem vir dos secrets
`LOGIN_USERNAME` e `LOGIN_PASSWORD`. Sem eles, são usadas as credenciais públicas do SauceDemo.
