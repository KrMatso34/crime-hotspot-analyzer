import { performance } from "node:perf_hooks";

/**
 * KAGS Query Benchmark
 * Measures performance of database queries used for map rendering.
 */

async function bench(name, fn, runs = 50) {
  // Warm-up
  for (let i = 0; i < 5; i++) await fn();

  const times = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];

  console.log(
    `${name} → avg ${avg.toFixed(2)}ms | p50 ${p50.toFixed(2)}ms | p95 ${p95.toFixed(2)}ms`
  );
}

async function main() {
  await bench("Fetch latest 500 incidents", async () => {
    // Replace with real Drizzle query
    await new Promise(r => setTimeout(r, 6));
  });

  await bench("Bounding box incident query", async () => {
    // Replace with real spatial query
    await new Promise(r => setTimeout(r, 10));
  });
}

main();
