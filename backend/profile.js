// Profile script for memory analysis
import { createServer } from 'http';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3000;
const PROFILE_DURATION = 60000; // 60 seconds
const OUTPUT_DIR = join(__dirname, '.clinic');

// Start the server
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Memory profiling in progress...');
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Profiling for ${PROFILE_DURATION/1000} seconds...`);
  
  // Start memory profiling
  const clinic = exec(`npx clinic heapprofiler -- node ${join(__dirname, 'src/index.js')}`, {
    cwd: __dirname,
    stdio: 'inherit'
  });

  // Stop profiling after specified duration
  setTimeout(() => {
    console.log('Stopping profiler...');
    process.kill(clinic.pid, 'SIGINT');
    process.exit(0);
  }, PROFILE_DURATION);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nProfiling stopped by user');
  process.exit(0);
});
