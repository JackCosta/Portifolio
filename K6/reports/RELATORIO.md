# Relatório de Teste de Carga: Restful-Booker `GET /booking`

| Item              | Valor                                                                              |
| ----------------- | ---------------------------------------------------------------------------------- |
| Data da execução  | 07/10/2026, 13:12 às 13:18 (BRT)                                                   |
| Alvo              | `https://restful-booker.herokuapp.com/booking` (Heroku, API pública de prática)    |
| Ferramenta        | k6 v2.3.0, executor `ramping-vus`                                                  |
| Gerador de carga  | macOS, 8 vCPUs, link local de ~287 Mbps de download (medido com `networkQuality`) |
| Perfil            | 1 min de ramp-up → **5 min com 500 VUs simultâneos** → 30 s de ramp-down          |
| Mix de tráfego    | 50% todos os IDs · 30% filtro por nome · 20% filtro por datas                      |
| Think time        | 1 a 3 s (aleatório) entre iterações                                               |
| Resultado         | ✅ **Aprovado**: todos os thresholds atendidos (exit code 0)                       |

Artefatos desta execução:

- [`load-dashboard.html`](load-dashboard.html): dashboard do k6 com gráficos ao longo do tempo
- [`load-summary.html`](load-summary.html): relatório HTML (thresholds, checks, métricas)
- [`load-summary.json`](load-summary.json): resumo bruto
- [`load-timeseries.txt`](load-timeseries.txt): análise em janelas de 30 s (`scripts/analyze_timeseries.py`)

---

## 1. Resumo executivo

A API suportou **500 usuários simultâneos por 5 minutos sem nenhum erro**: foram 73.828 requisições, todas com
status 200 e 100% dos 295.308 checks aprovados. A vazão sustentada no platô ficou entre **205 e 225 req/s**,
e o p95 global foi de **502 ms**, bem abaixo do SLO de 2 s.

Por outro lado, a latência **não ficou estável** com a carga constante: a mediana subiu de 140 ms para 400 ms ao
longo do platô, e houve picos de cauda de até 3,9 s. Os três gargalos identificados:

1. **Listagem completa sem paginação e sem compressão**: o payload cresceu de 9 KB para 50 KB durante o teste,
   e o tempo de download do corpo passou a dominar a latência do Example 1.
2. **Enfileiramento intermitente no servidor** com 500 VUs: o p95 do TTFB saltou de 145 ms para até 754 ms em
   rajadas, mesmo com a mediana estável.
3. **Ambiente não controlado**: a massa de dados mudou durante a execução (outros usuários criando reservas),
   então os resultados não são reproduzíveis só com este teste.

---

## 2. Thresholds (SLOs)

| Threshold                                      | Critério          | Resultado      | Status |
| ---------------------------------------------- | ----------------- | -------------- | ------ |
| `http_req_failed`                              | `rate < 1%`       | **0,00%**      | ✅     |
| `http_req_duration` p(95)                      | `< 2000 ms`       | **502 ms**     | ✅     |
| `http_req_duration` p(99)                      | `< 4000 ms`       | **913 ms**     | ✅     |
| `http_req_duration{endpoint:list_all}` p(95)   | `< 2500 ms`       | **550 ms**     | ✅     |
| `http_req_duration{endpoint:filter_name}` p(95)| `< 1500 ms`       | **417 ms**     | ✅     |
| `http_req_duration{endpoint:filter_dates}` p(95)| `< 1500 ms`      | **417 ms**     | ✅     |
| `checks`                                       | `rate > 99%`      | **100,00%**    | ✅     |
| `functional_errors` (auto-abort)               | `rate < 20%`      | **0,00%**      | ✅     |

## 3. Métricas principais

| Métrica                          | Valor                                          |
| -------------------------------- | ---------------------------------------------- |
| Requisições totais               | 73.828 (média de 187,7 req/s em 6m30s)         |
| Vazão no platô de 500 VUs        | 205 a 225 req/s                                |
| Iterações interrompidas          | 0                                              |
| Dados recebidos / enviados       | 1,1 GB / 7,0 MB                                |
| Pico de banda recebida           | 5,0 MB/s (~40 Mbps, 14% do link local)         |
| Erros 5xx / 429 / rede           | 0 / 0 / 0                                      |

### Latência (`http_req_duration`)

| Consulta                    | Amostras | avg    | p50    | p90    | p95    | p99    | max     |
| --------------------------- | -------- | ------ | ------ | ------ | ------ | ------ | ------- |
| **Global**                  | 73.828   | 260 ms | 269 ms | 422 ms | 502 ms | 913 ms | 3.930 ms|
| Example 1: todos os IDs     | 37.064   | 342 ms | 284 ms | 436 ms | 550 ms | 989 ms | 3.937 ms|
| Example 2: filtro por nome  | 22.002   | 177 ms | 140 ms | 226 ms | 417 ms | 788 ms | 3.623 ms|
| Example 3: filtro por datas | 14.761   | 178 ms | 140 ms | 222 ms | 417 ms | 800 ms | 3.338 ms|

### Decomposição do tempo de resposta

| Fase                              | p50     | p95     | Leitura                                                    |
| --------------------------------- | ------- | ------- | ---------------------------------------------------------- |
| `http_req_blocked` (fila/conexão) | 1 µs    | 2 µs    | Keep-alive funcionando: conexões reaproveitadas            |
| `http_req_waiting` (TTFB)         | 140 ms  | 339 ms  | p50 ≈ RTT de rede (mínimo de 129 ms); a cauda indica fila no servidor |
| `http_req_receiving` (download)   | 38 ms   | 280 ms  | Cresce com o tamanho do payload (ver seção 4.1)            |

## 4. Evolução ao longo do tempo (janelas de 30 s)

```
 t(s)  VUs  req/s  MB/s    p50    p95    p99    max TTFB50 TTFB95 recv50 recv95 lista_KB
    0  243   58.9  0.29    140    265    283    293    139    145      0    128      9.3
   30  493  171.0  1.12    141    284    288    298    139    145      0    141     12.0
   60  500  225.6  1.83    151    285    290    375    139    145      2    142     15.1
   90  500  221.6  2.16    268    357    517   1778    140    254     44    153     18.3
  120  500  188.3  2.16    275   1050   1807   3937    141    754     78    250     21.6   <- pico de cauda
  150  500  218.4  2.86    269    398    550    849    140    257     67    166     24.9
  180  500  210.5  3.09    273    599    813   1873    141    452     66    180     28.4
  210  500  206.8  3.55    273    741   1236   1913    141    537    111    220     31.9
  240  500  218.3  4.08    271    531    777   1491    140    384     94    156     35.2
  270  500  208.8  4.16    272    480    657   1963    141    299     53    280     38.5
  300  500  210.7  4.59    286    508    671   1102    141    246     89    313     41.8
  330  500  208.3  5.00    405    661   1069   2067    140    415    166    305     45.1
  360  500  113.8  3.26    398    428    435    445    139    145    264    285     47.8   <- ramp-down
```

*Tempos em ms. TTFB = `http_req_waiting`; recv = `http_req_receiving`; lista_KB = tamanho médio da resposta do
Example 1 na janela.*

---

## 5. Análise e gargalos identificados

### 5.1 Listagem completa sem paginação e sem compressão (principal gargalo)

- `GET /booking` sem filtro devolve **todos** os IDs da base. Durante o teste, a resposta cresceu de **9 KB para
  50 KB**, chegando a 2.745 reservas (`bookings_returned` máx.), e logo após o teste já estava em 65 KB.
- A API **não comprime** a resposta, mesmo quando o cliente envia `Accept-Encoding: gzip` (não há
  `Content-Encoding` no retorno). Com gzip, os 65 KB cairiam para **8,7 KB (−87%)**.
- O efeito aparece no tempo de download: o `recv` p50 subiu de **0 ms para 166 a 264 ms** conforme a lista
  cresceu, e a mediana do Example 1 dobrou (140 → 284 ms) enquanto o TTFB p50 ficou fixo em 140 ms. Ou seja,
  **o servidor responde rápido, mas o corpo demora a chegar**.
- O que limita o download não é a banda local: o pico foi de 40 Mbps contra 287 Mbps disponíveis. A causa é a
  latência de rede (RTT ≈ 130 ms até o Heroku). Um corpo de 50 KB não cabe na janela inicial de congestionamento
  do TCP (~14 KB) e precisa de 2 a 3 viagens de ida e volta, principalmente porque a janela é reiniciada após
  o *think time* ocioso de cada usuário. Comprimido (< 14 KB), o corpo caberia em uma única viagem.
- Os filtros (Examples 2 e 3) retornam poucos itens e mantiveram p50 de 140 ms (igual ao RTT), o que reforça
  que o custo está no tamanho da resposta e não na consulta em si.

**Recomendações:** paginar a listagem (`?page=&size=` ou cursor), habilitar compressão (middleware
`compression` no Express) e considerar cache HTTP condicional: a API já envia `ETag`, mas o ganho só vem se o
cliente usar `If-None-Match` e receber `304`.

### 5.2 Enfileiramento intermitente no servidor sob 500 VUs

- Até ~300 VUs (ramp-up), o TTFB p95 ficou cravado em 145 ms. Com 500 VUs, a **mediana continuou em 140 ms, mas o
  p95 oscilou entre 246 e 754 ms**, e o p99 global chegou a 1,8 s na janela de t = 120 s (máx. 3,9 s).
- Esse padrão (mediana estável e cauda instável) é típico de **fila momentânea no servidor**: um dyno Node.js
  processa o event loop em uma única thread, e rajadas de requisições simultâneas, sobretudo as listagens grandes
  que serializam milhares de objetos em JSON, bloqueiam as demais por alguns instantes.
- O efeito se propaga para a vazão: na janela do pico, ela caiu de 222 para **188 req/s**. Como o modelo de carga
  é fechado (cada VU só envia a próxima requisição após receber a anterior), latência maior significa menos
  requisições por segundo. Em produção, com usuários que não esperam, isso viraria fila crescente.
- Não houve erros (nenhum 5xx, 429 ou timeout), então o serviço está **degradando de forma graciosa, mas já
  perto do limite**: a cauda (p99 ≈ 1 s) é 7 vezes a mediana dos filtros.

**Recomendações:** escalar horizontalmente (mais dynos ou instâncias), usar *cluster mode* do Node e reduzir o
custo de serialização da listagem (paginação, item 5.1). Para confirmar o ponto de saturação, rodar um
**stress test** em degraus (500 → 750 → 1.000 VUs) e um **soak test** (por exemplo, 300 VUs por 1 h), com
monitoramento de CPU, event loop lag e memória do lado do servidor.

### 5.3 Ambiente não controlado

- A Restful-Booker é pública, compartilhada e **reinicia a base periodicamente**. Durante o teste, outros
  clientes criaram cerca de 2.300 reservas (~350/min), o que mudou o tamanho da resposta do Example 1 e,
  portanto, o resultado. Minutos antes do teste, a mesma requisição retornava 59 KB; no smoke, 5 KB.
- A latência também inclui ~130 ms de rede entre o gerador (Brasil) e o Heroku (EUA). Nenhuma requisição ficou
  abaixo de 129 ms, então esse é o piso imposto pela distância, não pela API.

**Recomendações:** para resultados comparáveis entre execuções, rodar contra um ambiente dedicado com massa de
dados fixa e de uma região próxima ao servidor, e registrar o tamanho da base junto com o resultado (a métrica
`bookings_returned` já faz isso).

### 5.4 Validação do próprio teste

- **O gerador entregou a carga planejada.** A vazão teórica do modelo é 500 VUs ÷ (2 s de think time médio +
  ~0,3 s de resposta) ≈ 217 req/s; a observada no platô foi de 205 a 225 req/s.
- `http_req_blocked` p99 de 15 µs e zero erros de rede indicam que o gerador **não foi gargalo** de conexões nem
  de banda (14% do link). O uso de CPU da máquina geradora não foi coletado; em execuções futuras convém
  monitorá-lo ou rodar a carga a partir de um runner de CI ou do Grafana Cloud k6.

---

## 6. Conclusão

| Pergunta                                          | Resposta                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| A API suporta 500 usuários simultâneos por 5 min? | **Sim.** 0% de erros, p95 de 502 ms e p99 de 913 ms                 |
| O desempenho é estável sob carga constante?       | **Parcialmente.** A mediana subiu ~3x e há picos de cauda de até 3,9 s |
| Principal gargalo                                 | Listagem completa sem paginação e sem gzip (custo cresce com a base) |
| Segundo gargalo                                   | Fila intermitente no servidor (TTFB p95 de até 754 ms com 500 VUs)  |
| Próximos passos                                   | Paginação + compressão; stress e soak tests com monitoramento do servidor |

Com a base crescendo no ritmo observado, a latência da listagem completa tende a continuar subindo
linearmente. Paginação e compressão são as mudanças de maior impacto e menor custo para manter o SLO à medida
que o volume de dados aumentar.
