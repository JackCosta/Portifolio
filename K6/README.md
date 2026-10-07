# Restful-Booker – Teste de Carga do `GET /booking` com k6

Teste de carga da API pública [Restful-Booker](https://restful-booker.herokuapp.com/apidoc/index.html#api-Booking-GetBookings)
com **[k6](https://k6.io/)**, simulando **500 usuários simultâneos por 5 minutos** sobre o endpoint `GET /booking`
nos três cenários da documentação:

| Exemplo da documentação          | Requisição                                         | Peso no mix |
| -------------------------------- | -------------------------------------------------- | ----------- |
| Example 1 – todos os IDs         | `GET /booking`                                     | 50%         |
| Example 2 – filtro por nome      | `GET /booking?firstname=...&lastname=...`          | 30%         |
| Example 3 – filtro por datas     | `GET /booking?checkin=CCYY-MM-DD&checkout=...`     | 20%         |

📄 **Relatório e análise do resultado: [reports/RELATORIO.md](reports/RELATORIO.md)**

## Stack

| Item       | Ferramenta                                                                           |
| ---------- | ------------------------------------------------------------------------------------ |
| Carga      | k6 (executor `ramping-vus`)                                                          |
| Relatórios | k6 Web Dashboard (HTML), k6-reporter (HTML), resumo JSON, série temporal CSV         |
| Análise    | `scripts/analyze_timeseries.py` (latência/vazão/erros em janelas de tempo)          |
| CI/CD      | GitHub Actions (smoke a cada push; carga de 500 VUs sob demanda via `workflow_dispatch`) |

## Estrutura

```
src/
├── tests/booking-load.test.js   # Cenário: options, setup (health check), mix de tráfego, handleSummary
├── config/
│   ├── env.js                   # BASE_URL, PROFILE, think time e pasta de relatórios via -e/variáveis
│   ├── profiles.js              # Perfis de carga: smoke (2 VUs/30s) e load (500 VUs/5 min)
│   └── thresholds.js            # SLOs: taxa de erro, p95/p99 global e por endpoint, checks, auto-abort
├── lib/
│   ├── booking-api.js           # Requisições + checks funcionais + métricas customizadas
│   ├── metrics.js               # Métricas customizadas (Rate, Trend, Counter)
│   └── summary.js               # Saídas do handleSummary: terminal, HTML e JSON
└── data/search-params.json      # Massa de dados dos filtros (SharedArray)
scripts/analyze_timeseries.py    # Análise temporal da saída CSV
reports/                         # Relatório da execução (RELATORIO.md, dashboards HTML, JSON)
```

## Perfil de carga

```
VUs
500 |        ┌────────────────────────────┐
    |       /                              \
    |      /                                \
  0 |_____/                                  \____
       1 min ramp-up     5 min platô      30 s ramp-down
```

Cada VU executa uma iteração do mix e espera de 1 a 3 s (*think time*) antes da próxima, simulando um usuário
real em vez de um laço de requisições sem pausa.

## Métricas e thresholds

| Métrica                                        | Tipo    | Threshold / uso                                                   |
| ---------------------------------------------- | ------- | ----------------------------------------------------------------- |
| `http_req_failed`                              | Rate    | `< 1%`                                                            |
| `http_req_duration`                            | Trend   | `p(95) < 2000 ms`, `p(99) < 4000 ms`                              |
| `http_req_duration{endpoint:list_all}`         | Trend   | `p(95) < 2500 ms`                                                 |
| `http_req_duration{endpoint:filter_name}`      | Trend   | `p(95) < 1500 ms`                                                 |
| `http_req_duration{endpoint:filter_dates}`     | Trend   | `p(95) < 1500 ms`                                                 |
| `checks`                                       | Rate    | `> 99%` (status 200, content-type JSON, array, `bookingid` inteiro) |
| `functional_errors`                            | Rate    | `< 20%`, com **abortOnFail** após 1 min (protege a API pública)    |
| `response_size_bytes`                          | Trend   | Tamanho do payload por endpoint (custo da listagem sem paginação) |
| `bookings_returned`                            | Trend   | Quantidade de reservas retornadas por consulta                    |
| `server_errors_5xx` / `rate_limited_429` / `network_errors` | Counter | Classificação dos erros: saturação, limitação ou rede  |

Boas práticas aplicadas:

- **Tag `name` fixa por tipo de consulta**: URLs com query string diferente são agregadas numa única série, sem
  explosão de cardinalidade de métricas.
- **Tag `endpoint`** permite thresholds e análise separados por tipo de consulta.
- **`SharedArray`** para a massa de dados: carregada uma vez e compartilhada pelos 500 VUs.
- **`setup()` com health check** (`GET /ping`): a carga não começa se a API estiver fora do ar.
- **Auto-abort** quando a taxa de erro passa de 20%: não continua sobrecarregando um serviço público já degradado.
- **Timeout explícito** (30 s) e **User-Agent identificável** nas requisições.

## Como executar

Pré-requisito: [k6 instalado](https://grafana.com/docs/k6/latest/set-up/install-k6/) (`brew install k6`).

```bash
# Validação rápida do script (2 VUs por 30 s)
k6 run -e PROFILE=smoke src/tests/booking-load.test.js

# Teste de carga: 500 VUs por 5 min, com dashboard HTML e série temporal CSV
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=reports/load-dashboard.html \
  k6 run -e PROFILE=load --out csv=reports/raw/load-metrics.csv.gz src/tests/booking-load.test.js

# Análise temporal (janelas de 30 s)
python3 scripts/analyze_timeseries.py reports/raw/load-metrics.csv.gz 30
```

Variáveis disponíveis (`-e CHAVE=valor`): `PROFILE` (`smoke` | `load`), `BASE_URL`, `THINK_TIME_MIN`,
`THINK_TIME_MAX`, `REPORT_DIR`.

Saídas geradas em `reports/`:

| Arquivo                      | Conteúdo                                                        |
| ---------------------------- | --------------------------------------------------------------- |
| `load-dashboard.html`        | Dashboard oficial do k6 com gráficos ao longo do tempo          |
| `load-summary.html`          | Relatório HTML do k6-reporter (thresholds, checks, métricas)   |
| `load-summary.json`          | Resumo bruto do `handleSummary` (para CI ou comparações)        |
| `raw/load-metrics.csv.gz`    | Série temporal de todas as amostras (não versionada)            |

O k6 encerra com **exit code 99** quando algum threshold é violado, o que falha o pipeline de CI.

## CI/CD

`.github/workflows/load-test.yml`:

- **push / pull request**: roda o perfil `smoke` (valida script e thresholds sem gerar carga real).
- **workflow_dispatch**: permite escolher `smoke` ou `load` (500 VUs). A carga completa é manual para não
  sobrecarregar a API pública a cada commit.
- Relatórios publicados como artefato da execução.
