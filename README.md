# Portfólio de Quality Engineering

## Sobre mim

Sou profissional de Tecnologia da Informação com mais de 15 anos de experiência em Quality Assurance, Quality
Engineering, automação de testes, requisitos, negócios e produto. Atuo em ambientes complexos, com experiência em
automação Web, Mobile, E2E e Backend, APIs, BDD, testes de integração e de performance, CI/CD e AWS, sempre aliando
visão técnica, qualidade e entendimento de negócio.

Também trabalho com Discovery, definição e validação de problemas, gestão e priorização de backlog, roadmap,
métricas e KPIs, OKRs, MVP, análise de dados, jornada do cliente e gestão de stakeholders. Hoje venho ampliando
minha atuação na integração entre Qualidade, Produto e Inteligência Artificial, com conhecimentos em agentes de IA,
Engenharia de Prompt, MCP, SDD e automação de testes com IA.

## Sobre este portfólio

Este portfólio reúne cinco projetos de automação que cobrem as principais camadas da pirâmide de testes:
**front-end E2E, API e performance**. Usei duas aplicações públicas de prática, o **SauceDemo** (e-commerce) e a
**Restful-Booker** (API REST de reservas). Assim, o mesmo domínio aparece testado com ferramentas diferentes, o que
mostra como escolho a ferramenta certa para cada contexto.

Os projetos seguem os mesmos princípios:

- **BDD com Gherkin em português**, para que os cenários sejam legíveis por negócio e produto
- **Arquitetura em camadas** (Page Objects e Service Objects)
- **Massa de dados separada** do código
- **Relatórios com evidências**
- **Pipelines de CI/CD** no GitHub Actions

| Projeto                                      | Camada      | Aplicação     | Stack                                   |
| -------------------------------------------- | ----------- | ------------- | --------------------------------------- |
| [Front-Cypress](Front-Cypress/)              | E2E         | SauceDemo     | Cypress, Cucumber, JavaScript           |
| [Front-PlayWright](Front-PlayWright/)        | E2E         | SauceDemo     | Playwright, playwright-bdd, TypeScript  |
| [Back-Cypress](Back-Cypress/)                | API         | Restful-Booker| Cypress, Cucumber, Ajv, JavaScript      |
| [Back-Rest-Assured](Back-Rest-Assured/)      | API         | Restful-Booker| Java 21, Rest Assured, Cucumber, Allure |
| [K6](K6/)                                    | Performance | Restful-Booker| k6, JavaScript, Python (análise)        |

## Projetos

### Front-end E2E

#### [SauceDemo com Cypress + BDD](Front-Cypress/)

Login e checkout completo. O fluxo vai da vitrine à confirmação do pedido, validando itens, pagamento, entrega,
subtotal, taxa e total. Os valores são conferidos de duas formas: pelo valor esperado e pelo cálculo, feito em
centavos para evitar erro de ponto flutuante. Também cobre cenários negativos de campos obrigatórios e de acesso
sem login.

- Seletores isolados em arquivos de elementos
- Login reaproveitado com `cy.session`
- Sem esperas fixas
- Prints de evidência anexados ao relatório

#### [SauceDemo com Playwright + TypeScript + BDD](Front-PlayWright/)

Login e navegação até o formulário do comprador, executados em **Chromium, Firefox, WebKit e mobile (Pixel 7)**.

- Page Objects injetados como fixtures do Playwright
- Asserções com retentativa automática
- TypeScript em modo strict, com ESLint
- Screenshot, vídeo e trace em caso de falha
- Pipeline: lint → matriz de navegadores → relatório unificado

### API

#### [Restful-Booker com Cypress + BDD](Back-Cypress/)

Cobertura do CRUD completo de reservas (GET, POST, PUT, DELETE) e da autenticação, incluindo métodos não
suportados.

- Validação de contrato com JSON Schema (Ajv)
- Validação de headers e tempo de resposta
- Diferentes formas de autenticação: token, Basic e inválidas
- Limpeza automática das reservas criadas ao final de cada cenário
- Relatório HTML com request e response anexados

#### [Restful-Booker com Java + Rest Assured + BDD](Back-Rest-Assured/)

Testes do endpoint de autenticação com Java 21, Cucumber, Service Objects e injeção de dependência (PicoContainer).

- Validação de contrato e headers
- Mais de 13 variações de credenciais inválidas, incluindo SQL injection, tipos errados e JSON malformado
- Execução paralela
- Relatórios em Allure
- Pipeline: compilação → smoke → regressão, além de uma execução diária para detectar mudanças na API

### Performance

#### [Restful-Booker com k6: teste de carga](K6/)

Simulação de **500 usuários simultâneos por 5 minutos** no `GET /booking`, misturando os três tipos de consulta da
documentação.

- Thresholds de erro e de latência (p95/p99) por tipo de consulta
- Métricas próprias de tamanho de resposta e de classificação de erros
- Verificação da API antes de começar e interrupção automática se a taxa de erro passar de 20%, para não
  sobrecarregar uma API pública já degradada
- Análise dos resultados ao longo do tempo, além do relatório do k6

**Resultado:** a API suportou a carga com 0% de erro (p95 de 502 ms), mas a análise identificou três gargalos:

1. Listagem sem paginação e sem compressão (o payload cresceu de 9 KB para 50 KB durante o teste)
2. Fila intermitente no servidor
3. Instabilidade do ambiente compartilhado

Para cada gargalo, o [relatório](K6/reports/RELATORIO.md) traz recomendações técnicas.

## O que este portfólio demonstra

- **Estratégia de testes em camadas**: E2E, API, contrato e performance, cada um com a ferramenta adequada.
- **Domínio de várias stacks**: Cypress, Playwright, Rest Assured e k6, em JavaScript, TypeScript e Java.
- **Cenários positivos e negativos** pensados a partir do negócio, incluindo os limites da própria aplicação
  (documentados quando algo não pode ser testado).
- **Qualidade de código**: arquitetura em camadas, lint, padronização, dados externos e credenciais em variáveis
  de ambiente.
- **Rastreabilidade e evidências**: relatórios HTML e Allure, screenshots, vídeos, traces e logs HTTP.
- **Integração contínua**: pipelines com smoke e regressão, matriz de navegadores, execuções agendadas e
  publicação de relatórios.
- **Análise e comunicação**: além de executar, interpreto os resultados e transformo dados em recomendações para
  o time técnico e de produto.
