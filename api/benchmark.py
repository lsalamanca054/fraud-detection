"""Benchmark the deployed Render fraud-detection API.

Warms up the endpoint (handles free-tier cold start), sends 500 prediction
requests, then fetches /metrics. Uses stdlib only (urllib).
"""
import json
import math
import time
import urllib.request
import urllib.error

BASE = "https://fraud-detection-api-5nmq.onrender.com"
PREDICT = BASE + "/predict"
METRICS = BASE + "/metrics"
PAYLOAD = {"features": [120.50, 5, 1, 50000, 35, 14, 3, 6, 45.2, 1718000000]}
N = 500
WARMUP = 5


def post(url, body, timeout=120, retries=3):
    data = json.dumps(body).encode("utf-8")
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url, data=data,
                headers={"Content-Type": "application/json"}, method="POST"
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:  # transient TLS/network errors: back off and retry
            last_err = e
            time.sleep(0.25 * (attempt + 1))
    raise last_err


def get(url, timeout=60):
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    print(f"Warming up ({WARMUP} requests, not counted)...")
    for i in range(WARMUP):
        t0 = time.perf_counter()
        post(PREDICT, PAYLOAD)
        print(f"  warmup {i+1}/{WARMUP}: {(time.perf_counter()-t0)*1000:.1f} ms round-trip")

    print(f"\nSending {N} prediction requests...")
    rtts = []
    errors = 0
    start = time.perf_counter()
    for i in range(N):
        t0 = time.perf_counter()
        try:
            post(PREDICT, PAYLOAD)
            rtts.append((time.perf_counter() - t0) * 1000)
        except Exception as e:
            errors += 1
            print(f"  request {i+1} failed after retries: {e}")
        if (i + 1) % 50 == 0:
            print(f"  {i+1}/{N} done")
    wall = time.perf_counter() - start

    rtts.sort()
    n_ok = len(rtts)
    print("\n=== Client-side round-trip (includes network) ===")
    print(f"  successful: {n_ok}/{N}  errors: {errors}")
    print(f"  wall time: {wall:.1f} s  ({N/wall:.1f} req/s)")
    if n_ok:
        print(f"  avg RTT: {sum(rtts)/n_ok:.1f} ms")
        print(f"  p50 RTT: {rtts[int(n_ok*0.50)-1]:.1f} ms")
        print(f"  p95 RTT: {rtts[math.ceil(n_ok*0.95)-1]:.1f} ms")
        print(f"  max RTT: {rtts[-1]:.1f} ms")

    print("\n=== Server-side /metrics (model inference latency) ===")
    print(json.dumps(get(METRICS), indent=2))


if __name__ == "__main__":
    main()
