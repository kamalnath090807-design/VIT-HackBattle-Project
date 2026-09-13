/**
 * AURA Agent — Universal System Application & File/Folder Indexer
 *
 * Source: Master Automation Specification — Universal System Control
 *
 * Indexes:
 * 1. All installed system applications (Start Menu, AppData/Programs, Windows App Paths, system executables)
 * 2. User files & folders across Desktop, Documents, Downloads, Workspaces
 *
 * Provides:
 * - openFileOrFolder(target, editorPreference): Opens in VS Code (default), Notepad (if requested), or Antigravity IDE (if mentioned).
 * - launchApp(appName, args): Launches any installed application root.
 * - searchSystem(query, category): Searches apps, files, and folders across the system.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');

class SystemIndexer {
  constructor() {
    this.userHome = os.homedir();
    this.appIndex = new Map();
    this.fileIndex = new Map();
    this.lastIndexedAt = null;

    // Standard user root directories to index
    this.searchRoots = [
      path.join(this.userHome, 'Desktop'),
      path.join(this.userHome, 'Documents'),
      path.join(this.userHome, 'Downloads'),
      path.join(this.userHome, 'Desktop', 'VIT'),
      process.cwd(),
    ];

    // Standard editor executable paths
    this.vsCodeCmd = this.locateExecutable(['code.cmd', 'code.exe', path.join(this.userHome, 'AppData/Local/Programs/Microsoft VS Code/bin/code.cmd'), 'code']);
    this.notepadCmd = 'notepad.exe';
    this.antigravityCmd = this.locateExecutable([
      path.join(this.userHome, 'AppData/Local/Programs/antigravity/Antigravity.exe'),
      path.join(this.userHome, 'AppData/Local/Programs/Antigravity IDE/Antigravity IDE.exe'),
      'antigravity',
    ]);

    // Perform initial background scan
    this.indexApps();
  }

  locateExecutable(candidates) {
    for (const c of candidates) {
      if (!c) continue;
      if (fs.existsSync(c)) return c;
    }
    return candidates[0] || 'code';
  }

  /**
   * Scan and index all installed desktop applications from Start Menu and AppData.
   */
  indexApps() {
    try {
      const psScript = `
        $results = @()
        $startApps = Get-StartApps -ErrorAction SilentlyContinue | ForEach-Object {
          [PSCustomObject]@{
            name = $_.Name
            target = $_.AppID
            args = ''
            isAppId = $true
          }
        }
        if ($startApps) { $results += $startApps }

        $sh = New-Object -ComObject WScript.Shell
        $paths = @(
          "$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs",
          "$env:AppData\\Microsoft\\Windows\\Start Menu\\Programs"
        )
        Get-ChildItem -Path $paths -Recurse -Include *.lnk -ErrorAction SilentlyContinue | ForEach-Object {
          try {
            $link = $sh.CreateShortcut($_.FullName)
            if ($link.TargetPath) {
              $results += [PSCustomObject]@{
                name = $_.BaseName
                target = $link.TargetPath
                args = $link.Arguments
                isAppId = $false
              }
            }
          } catch {}
        }
        $results | ConvertTo-Json -Compress
      `;

      const tmpFile = path.join(os.tmpdir(), `aura_app_scan_${Date.now()}.ps1`);
      fs.writeFileSync(tmpFile, psScript, 'utf8');
      try {
        const raw = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpFile}"`, {
          maxBuffer: 15 * 1024 * 1024,
          timeout: 10000,
        }).toString();
        const apps = JSON.parse(raw);
        if (Array.isArray(apps)) {
          apps.forEach((app) => {
            if (app.name && app.target) {
              const key = app.name.toLowerCase().trim();
              this.appIndex.set(key, {
                name: app.name,
                target: app.target,
                args: app.args || '',
                isAppId: Boolean(app.isAppId),
                source: app.isAppId ? 'StartApps' : 'StartMenu',
              });
            }
          });
        }
      } finally {
        try { fs.unlinkSync(tmpFile); } catch (e) {}
      }
    } catch (err) {
      // Fallback: seed with prominent system and installed apps
    }

    // Seed common system applications
    const commonApps = [
      { name: 'WhatsApp', key: 'whatsapp', target: 'whatsapp:', isProtocol: true },
      { name: 'WhatsApp', key: 'whatsapp desktop', target: 'whatsapp:', isProtocol: true },
      { name: 'Telegram', key: 'telegram', target: 'tg:', isProtocol: true },
      { name: 'Visual Studio Code', key: 'vscode', target: 'code' },
      { name: 'Visual Studio Code', key: 'code', target: 'code' },
      { name: 'VS Code', key: 'vs code', target: 'code' },
      { name: 'Antigravity IDE', key: 'antigravity ide', target: this.antigravityCmd },
      { name: 'Antigravity', key: 'antigravity', target: this.antigravityCmd },
      { name: 'Notepad', key: 'notepad', target: 'notepad.exe' },
      { name: 'Google Chrome', key: 'chrome', target: 'chrome.exe' },
      { name: 'Microsoft Edge', key: 'edge', target: 'msedge.exe' },
      { name: 'Calculator', key: 'calculator', target: 'calc.exe' },
      { name: 'Calculator', key: 'calc', target: 'calc.exe' },
      { name: 'Command Prompt', key: 'cmd', target: 'cmd.exe' },
      { name: 'PowerShell', key: 'powershell', target: 'powershell.exe' },
      { name: 'Windows Terminal', key: 'terminal', target: 'wt.exe' },
      { name: 'Paint', key: 'paint', target: 'mspaint.exe' },
      { name: 'Paint', key: 'mspaint', target: 'mspaint.exe' },
      { name: 'File Explorer', key: 'explorer', target: 'explorer.exe' },
      { name: 'Task Manager', key: 'taskmgr', target: 'taskmgr.exe' },
      { name: 'Spotify', key: 'spotify', target: 'spotify.exe' },
      { name: 'Discord', key: 'discord', target: 'discord.exe' },
      { name: 'Figma', key: 'figma', target: 'figma.exe' },
      { name: 'VLC media player', key: 'vlc', target: 'vlc.exe' },
      { name: 'Ollama', key: 'ollama', target: 'ollama.exe' },
      { name: 'Canva', key: 'canva', target: 'Canva.exe' },
    ];

    commonApps.forEach((app) => {
      this.appIndex.set(app.key, {
        name: app.name,
        target: app.target,
        source: 'BuiltIn',
      });
    });

    this.lastIndexedAt = new Date().toISOString();
    return this.appIndex;
  }

  /**
   * Resolve an application name to its executable target.
   * @param {string} appName
   * @returns {Object|null}
   */
  resolveApp(appName) {
    if (!appName || typeof appName !== 'string') return null;
    const clean = appName.toLowerCase().trim();

    // 1. Direct key match
    if (this.appIndex.has(clean)) {
      return this.appIndex.get(clean);
    }

    // 2. Fuzzy substring match
    for (const [key, app] of this.appIndex.entries()) {
      if (key.includes(clean) || clean.includes(key) || app.name.toLowerCase().includes(clean)) {
        return app;
      }
    }

    // 3. Fallback: treat as direct command or exe
    return {
      name: appName,
      target: appName,
      source: 'DirectCommand',
    };
  }

  /**
   * Launch any system application root.
   * @param {string} appName
   * @param {string} [args='']
   */
  async launchApp(appName, args = '') {
    const app = this.resolveApp(appName);
    if (!app) {
      throw new Error(`Could not resolve application root for "${appName}"`);
    }

    const targetExe = app.target;
    const cmdArgs = args ? (Array.isArray(args) ? args : [args]) : (app.args ? [app.args] : []);

    try {
      if (app.isProtocol || (typeof targetExe === 'string' && targetExe.endsWith(':'))) {
        const psCmd = `Start-Process '${targetExe.replace(/'/g, "''")}'`;
        execSync(`powershell -NoProfile -Command "${psCmd}"`);
        return {
          success: true,
          app: app.name,
          executable: targetExe,
          message: `Successfully opened ${app.name} (${targetExe})`,
          timestamp: new Date().toISOString(),
        };
      }

      if (app.isAppId || (typeof targetExe === 'string' && (targetExe.includes('!') || targetExe.startsWith('shell:AppsFolder')))) {
        const shellTarget = targetExe.startsWith('shell:AppsFolder\\') ? targetExe : `shell:AppsFolder\\${targetExe}`;
        const psCmd = `Start-Process '${shellTarget.replace(/'/g, "''")}'`;
        execSync(`powershell -NoProfile -Command "${psCmd}"`);
        return {
          success: true,
          app: app.name,
          executable: targetExe,
          message: `Successfully opened ${app.name} (${targetExe})`,
          timestamp: new Date().toISOString(),
        };
      }

      const child = spawn(targetExe, cmdArgs, {
        detached: true,
        stdio: 'ignore',
        shell: true,
      });
      child.unref();

      return {
        success: true,
        app: app.name,
        executable: targetExe,
        message: `Successfully opened ${app.name} (${targetExe})`,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      // Fallback via PowerShell Start-Process
      const psCmd = `Start-Process -FilePath '${targetExe.replace(/'/g, "''")}' ${args ? `-ArgumentList '${args.replace(/'/g, "''")}'` : ''}`;
      execSync(`powershell -NoProfile -Command "${psCmd}"`);
      return {
        success: true,
        app: app.name,
        executable: targetExe,
        message: `Opened ${app.name} via PowerShell Start-Process`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Search for a file or folder across standard roots.
   * @param {string} targetName
   * @returns {string|null} Resolved absolute path
   */
  resolvePath(targetName) {
    if (!targetName || typeof targetName !== 'string') return null;
    const trimmed = targetName.trim().replace(/^['"]|['"]$/g, '');

    // 1. If it's already an absolute path and exists
    if (path.isAbsolute(trimmed) && fs.existsSync(trimmed)) {
      return path.resolve(trimmed);
    }

    // 2. Check relative to current working directory
    const cwdRelative = path.resolve(process.cwd(), trimmed);
    if (fs.existsSync(cwdRelative)) {
      return cwdRelative;
    }

    // 3. Search directly in search roots
    for (const root of this.searchRoots) {
      if (!fs.existsSync(root)) continue;

      const direct = path.join(root, trimmed);
      if (fs.existsSync(direct)) {
        return direct;
      }

      // Check subdirectories (1-2 levels deep)
      try {
        const entries = fs.readdirSync(root, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.toLowerCase() === trimmed.toLowerCase()) {
            return path.join(root, entry.name);
          }
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            const subPath = path.join(root, entry.name, trimmed);
            if (fs.existsSync(subPath)) {
              return subPath;
            }
          }
        }
      } catch (err) {}
    }

    // 4. Exact stem match (e.g. target "notes" matches "notes.txt" or folder "notes")
    const cleanTarget = trimmed.toLowerCase();
    for (const root of this.searchRoots) {
      if (!fs.existsSync(root)) continue;
      try {
        const entries = fs.readdirSync(root, { withFileTypes: true });
        for (const entry of entries) {
          const stem = path.parse(entry.name).name.toLowerCase();
          if (stem === cleanTarget || entry.name.toLowerCase() === cleanTarget) {
            return path.join(root, entry.name);
          }
        }
      } catch (err) {}
    }

    return null;
  }

  /**
   * Open any file or folder in specified editor (VS Code default, Notepad if requested, Antigravity IDE if mentioned).
   *
   * @param {string} target - File or folder name/path
   * @param {string} [editorPreference='vscode'] - 'vscode' | 'notepad' | 'antigravity'
   */
  async openFileOrFolder(target, editorPreference = 'vscode') {
    if (!target || typeof target !== 'string') {
      throw new Error('Target file or folder name is required');
    }

    // 1. Resolve exact file or folder path
    let resolved = this.resolvePath(target);
    if (!resolved) {
      // If unable to locate, default to cwd relative path
      resolved = path.resolve(process.cwd(), target);
    }

    // 2. Determine target editor
    const pref = (editorPreference || '').toLowerCase();
    let editorCmd = this.vsCodeCmd;
    let editorName = 'VS Code';

    if (pref.includes('notepad')) {
      editorCmd = this.notepadCmd;
      editorName = 'Notepad';
    } else if (pref.includes('antigravity')) {
      editorCmd = this.antigravityCmd;
      editorName = 'Antigravity IDE';
    } else {
      // Default: VS Code
      editorCmd = this.vsCodeCmd;
      editorName = 'VS Code';
    }

    // 3. Launch editor with target path
    try {
      const child = spawn(editorCmd, [resolved], {
        detached: true,
        stdio: 'ignore',
        shell: true,
      });
      child.unref();

      return {
        success: true,
        target: resolved,
        isDirectory: fs.existsSync(resolved) ? fs.statSync(resolved).isDirectory() : false,
        editor: editorName,
        executable: editorCmd,
        message: `Opened "${path.basename(resolved)}" in ${editorName} (${resolved})`,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      // Fallback via PowerShell
      const psScript = `Start-Process -FilePath '${editorCmd.replace(/'/g, "''")}' -ArgumentList '"${resolved.replace(/"/g, '`"')}"'`;
      execSync(`powershell -NoProfile -Command "${psScript}"`);

      return {
        success: true,
        target: resolved,
        isDirectory: fs.existsSync(resolved) ? fs.statSync(resolved).isDirectory() : false,
        editor: editorName,
        executable: editorCmd,
        message: `Opened "${path.basename(resolved)}" in ${editorName} via PowerShell Start-Process`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Search system for files, folders, and applications.
   * @param {string} query
   * @param {string} [category='all'] - 'file' | 'folder' | 'app' | 'all'
   */
  searchSystem(query, category = 'all') {
    if (!query) return { results: [] };
    const q = query.toLowerCase().trim();
    const results = [];

    // Search applications
    if (category === 'app' || category === 'all') {
      for (const [key, app] of this.appIndex.entries()) {
        if (key.includes(q) || app.name.toLowerCase().includes(q)) {
          results.push({
            type: 'application',
            name: app.name,
            path: app.target,
            source: app.source,
          });
        }
      }
    }

    // Search user files & folders
    if (category !== 'app') {
      for (const root of this.searchRoots) {
        if (!fs.existsSync(root)) continue;
        try {
          const items = fs.readdirSync(root, { withFileTypes: true });
          for (const item of items) {
            if (item.name.toLowerCase().includes(q)) {
              results.push({
                type: item.isDirectory() ? 'folder' : 'file',
                name: item.name,
                path: path.join(root, item.name),
              });
            }
          }
        } catch (e) {}
      }
    }

    return {
      query,
      category,
      count: results.length,
      results: results.slice(0, 30),
    };
  }
}

const systemIndexer = new SystemIndexer();

module.exports = {
  SystemIndexer,
  systemIndexer,
};
