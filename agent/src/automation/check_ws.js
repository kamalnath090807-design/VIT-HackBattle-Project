const { execSync } = require('child_process');
try {
  const script = "$wscript = New-Object -ComObject WScript.Shell; $p = Get-Process -Name '*WhatsApp*' | Select-Object -First 1; if ($p) { $res = $wscript.AppActivate($p.Id); Write-Output ('AppActivate by PID ' + $p.Id + ': ' + $res) } else { 'No WhatsApp process found' }";
  const out = execSync(`powershell -NoProfile -Command "${script}"`).toString();
  console.log(out);
} catch (e) {
  console.error(e.message);
}
