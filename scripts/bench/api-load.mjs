import autocannon from "autocannon";

/**
 * KAGS API Benchmark
 * Measures latency and throughput for endpoints used by the frontend map.
 */

const BASE_URL = process.env.BENCH_URL || "http://localhost:3000";

const ENDPOINTS = [
  "/api/incidents?limit=100",
  "/api/incidents?limit=500",
  "/api/incidents?bbox=-122.45,47.55,-122.25,47.72&limit=500"
];

async function run(endpoint) {
  const url = BASE_URL + endpoint;

  console.log(`\nBenchmarking ${url}`);

  const result = await autocannon({
    url,
    connections: 50,
    duration: 15
  });

  autocannon.printResult(result);

  return {
    endpoint,
    reqPerSec: result.requests.average,
    p50: result.latency.p50,
    p95: result.latency.p95
  };
}

(async () => {
  const summary = [];

  for (const ep of ENDPOINTS) {
    summary.push(await run(ep));
  }

  console.log("\n=== BENCHMARK SUMMARY ===");
  summary.forEach(r => {
    console.log(
      `${r.endpoint} → ${r.reqPerSec.toFixed(1)} req/s | p50 ${r.p50}ms | p95 ${r.p95}ms`
    );
  });
})();
