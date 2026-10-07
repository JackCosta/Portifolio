"""Análise temporal da saída CSV do k6 (k6 run --out csv=arquivo.csv.gz).

Agrega as métricas em janelas de tempo para mostrar como latência, vazão e erros
evoluem conforme a concorrência sobe (ramp-up), estabiliza (platô) e desce.

Uso: python3 scripts/analyze_timeseries.py reports/raw/load-metrics.csv.gz [janela_s]
"""
import csv
import gzip
import sys
from collections import defaultdict


def percentile(values, p):
    if not values:
        return float("nan")
    values = sorted(values)
    k = (len(values) - 1) * p / 100
    f, c = int(k), min(int(k) + 1, len(values) - 1)
    return values[f] + (values[c] - values[f]) * (k - f)


def endpoint_of(row):
    for pair in (row.get("extra_tags") or "").split("&"):
        if pair.startswith("endpoint="):
            return pair.split("=", 1)[1]
    return None


def main(path, window):
    opener = gzip.open if path.endswith(".gz") else open
    buckets = defaultdict(lambda: {"dur": [], "wait": [], "recv": [], "list_size": [], "failed": 0, "reqs": 0,
                                   "vus": 0, "bytes": 0, "status": defaultdict(int)})
    per_endpoint = defaultdict(list)
    start = None

    with opener(path, "rt", newline="") as fh:
        for row in csv.DictReader(fh):
            ts = int(row["timestamp"])
            if start is None:
                start = ts  # a saída CSV do k6 é cronológica
            b = buckets[(ts - start) // window * window]
            name, value = row["metric_name"], float(row["metric_value"])
            if name == "vus":
                b["vus"] = max(b["vus"], int(value))
            elif name == "http_req_duration" and row["name"].startswith("GET /booking"):
                b["dur"].append(value)
                b["reqs"] += 1
                b["status"][row["status"]] += 1
                per_endpoint[endpoint_of(row)].append(value)
            elif name == "http_req_waiting" and row["name"].startswith("GET /booking"):
                b["wait"].append(value)
            elif name == "http_req_receiving" and row["name"].startswith("GET /booking"):
                b["recv"].append(value)
            elif name == "data_received":
                b["bytes"] += value
            elif name == "response_size_bytes" and endpoint_of(row) == "list_all":
                b["list_size"].append(value)
            elif name == "http_req_failed" and row["name"].startswith("GET /booking"):
                b["failed"] += int(value)

    # p50/p95/p99/max = http_req_duration; TTFB = http_req_waiting (tempo de servidor + rede);
    # recv = http_req_receiving (download do corpo); lista_KB = tamanho médio do GET /booking sem filtro.
    print(f"{'t(s)':>5} {'VUs':>4} {'req/s':>6} {'MB/s':>5} {'p50':>6} {'p95':>6} {'p99':>6} {'max':>6} "
          f"{'TTFB50':>6} {'TTFB95':>6} {'recv50':>6} {'recv95':>6} {'lista_KB':>8} {'erro%':>6}  status")
    for ts in sorted(buckets):
        b = buckets[ts]
        if not b["reqs"]:
            continue
        statuses = ", ".join(f"{k}:{v}" for k, v in sorted(b["status"].items()))
        list_kb = sum(b["list_size"]) / len(b["list_size"]) / 1024 if b["list_size"] else float("nan")
        print(f"{ts:>5} {b['vus']:>4} {b['reqs'] / window:>6.1f} {b['bytes'] / window / 1e6:>5.2f} "
              f"{percentile(b['dur'], 50):>6.0f} {percentile(b['dur'], 95):>6.0f} "
              f"{percentile(b['dur'], 99):>6.0f} {max(b['dur']):>6.0f} "
              f"{percentile(b['wait'], 50):>6.0f} {percentile(b['wait'], 95):>6.0f} "
              f"{percentile(b['recv'], 50):>6.0f} {percentile(b['recv'], 95):>6.0f} {list_kb:>8.1f} "
              f"{100 * b['failed'] / b['reqs']:>6.2f}  {statuses}")

    print("\nPor endpoint (ms):")
    for ep, values in sorted(per_endpoint.items(), key=lambda kv: str(kv[0])):
        print(f"  {ep:<14} n={len(values):>6}  p50={percentile(values, 50):>6.0f}  "
              f"p95={percentile(values, 95):>6.0f}  p99={percentile(values, 99):>6.0f}  max={max(values):>6.0f}")


if __name__ == "__main__":
    main(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 30)
