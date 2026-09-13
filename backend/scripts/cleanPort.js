/**
 * AURA Backend — Automatic Port Cleaner
 * Frees port 3001 prior to start/dev execution so EADDRINUSE is never encountered.
 */

const { execSync } = require('child_process');

function cleanPort(port = 3001) {
  if (process.platform === 'win32') {
    try {
      execSync(
        `powershell -NoProfile -ExecutionPolicy Bypass -Command "$conns = Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue; if ($conns) { $conns | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }"`
      );
    } catch (e) {}
  } else {
    try {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
    } catch (e) {}
  }
}

if (require.main === module) {
  cleanPort(process.env.PORT || 3001);
}

module.exports = { cleanPort };
