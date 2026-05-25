const fs = require('fs');
const path = require('path');

try {
  const content = fs.readFileSync(path.join(__dirname, 'logs_errores.json'), 'utf8');
  const logs = JSON.parse(content);
  console.log(`Total logs: ${logs.length}`);
  
  const uniqueErrors = {};
  logs.forEach(log => {
    const errorMsg = log.error || log.errorMensaje;
    const url = log.url || log.vista || 'unknown';
    const key = `${errorMsg} at ${url}`;
    if (!uniqueErrors[key]) {
      uniqueErrors[key] = {
        count: 0,
        error: errorMsg,
        url: url,
        stack: log.stack || log.stackTrace,
        latestTimestamp: log.timestamp || log.fechaStr
      };
    }
    uniqueErrors[key].count++;
  });
  
  console.log("\nUnique Errors:");
  Object.values(uniqueErrors).forEach(u => {
    console.log(`- [${u.count} times] ${u.error} (URL: ${u.url})`);
    console.log(`  Latest: ${u.latestTimestamp}`);
    console.log(`  Stack snippet: ${u.stack ? u.stack.split('\n').slice(0, 3).join('\n') : 'N/A'}`);
    console.log('---');
  });
} catch (e) {
  console.error("Error reading log file:", e.message);
}
