// scratch/test_load.js
import http from 'http';
import https from 'https';

const TARGET_URL = process.argv[2] || 'http://localhost:3000/';
const CONCURRENT_USERS = 53;

async function measureRequest(index) {
  const start = Date.now();
  const client = TARGET_URL.startsWith('https') ? https : http;

  return new Promise((resolve) => {
    client.get(TARGET_URL, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        const latency = Date.now() - start;
        resolve({
          index,
          statusCode: res.statusCode,
          latency,
          sizeBytes: Buffer.byteLength(body),
          success: res.statusCode === 200
        });
      });
    }).on('error', (err) => {
      const latency = Date.now() - start;
      resolve({
        index,
        statusCode: 0,
        latency,
        error: err.message,
        success: false
      });
    });
  });
}

async function runLoadTest() {
  console.log(`=== RUNNING LOAD TEST: SIMULATING ${CONCURRENT_USERS} CONCURRENT USERS ===`);
  console.log(`Target: ${TARGET_URL}\n`);

  const startTime = Date.now();

  // Trigger 53 concurrent requests
  const promises = [];
  for (let i = 1; i <= CONCURRENT_USERS; i++) {
    promises.push(measureRequest(i));
  }

  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;

  // Calculate stats
  const latencies = results.map(r => r.latency);
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);
  const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / CONCURRENT_USERS;
  const successCount = results.filter(r => r.success).length;
  const errorCount = CONCURRENT_USERS - successCount;

  console.log("=== RESULTS ===");
  console.log(`Total Requests: ${CONCURRENT_USERS}`);
  console.log(`✅ Success (200 OK): ${successCount}`);
  console.log(`❌ Failures/Errors: ${errorCount}`);
  console.log(`⏱️ Total Execution Time: ${totalTime} ms`);
  console.log(`🚀 Min Latency: ${minLatency} ms`);
  console.log(`🚀 Max Latency: ${maxLatency} ms`);
  console.log(`🚀 Avg Latency: ${avgLatency.toFixed(2)} ms`);

  if (errorCount > 0) {
    console.log("\nError details:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`- Request #${r.index}: Code ${r.statusCode} | Error: ${r.error || 'Non-200 Response'}`);
    });
  }

  if (successCount === CONCURRENT_USERS) {
    console.log(`\nStatus: EXCELLENT. Next.js server handled all 53 concurrent users successfully with ${avgLatency.toFixed(2)}ms average latency!`);
  } else {
    console.log("\nStatus: WARNING. Performance might need further optimization.");
  }
}

// Run immediately if target URL is passed, otherwise wait 2 seconds for local startup
const delay = process.argv[2] ? 0 : 2000;
setTimeout(runLoadTest, delay);
