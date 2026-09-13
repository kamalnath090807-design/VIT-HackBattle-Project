// core/phoneEngine.js — AURA Mobile Automation Engine
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile, exec } = require('child_process');
const contactEngine = require('./contactEngine');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'phone_config.json');

// Auto-discover ADB binary across SDKs, OEM tools, and PATH
const ADB_PATH = (function _findAdb() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const userProfile = process.env.USERPROFILE || '';
  const programFiles = process.env['ProgramFiles'] || '';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || '';
  const candidates = [
    path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
    path.join(userProfile, 'AppData', 'Local', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
    path.join(programFiles, 'ASUS', 'GlideX', 'adb.exe'),
    path.join(programFilesX86, 'ASUS', 'GlideX', 'adb.exe'),
    'C:\\platform-tools\\adb.exe',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'adb';
})();

const KEYCODE_DIGITS = {
  '0': '7', '1': '8', '2': '9', '3': '10', '4': '11',
  '5': '12', '6': '13', '7': '14', '8': '15', '9': '16',
};

function _loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (_) {}
  return { deviceModel: 'Android Device', pin: '090807', host: '', port: 5555, packages: {} };
}

function _saveConfig(cfg) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (_) {}
}

let activeDeviceId = null;
let _phoneState = { lastActiveApp: null, lastActionTimestamp: 0 };
let _lastVolumeIndex = 8;
let _isReconnecting = false;
let _lastReconnectFailTime = 0;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function runAdb(args, timeoutMs = 8000) {
  return new Promise((resolve) => {
    let finalArgs = [...args];
    const nonTargetCmds = ['devices', 'connect', 'disconnect', 'pair', 'start-server', 'kill-server'];
    if (activeDeviceId && !finalArgs.includes('-s') && !nonTargetCmds.includes(finalArgs[0])) {
      finalArgs = ['-s', activeDeviceId, ...finalArgs];
    }
    const isExe = ADB_PATH.endsWith('.exe');
    const opts = { timeout: timeoutMs };
    if (isExe) {
      execFile(ADB_PATH, finalArgs, opts, (err, stdout, stderr) => {
        resolve({
          success: !err,
          stdout: (stdout || '').trim(),
          stderr: (stderr || (err ? err.message : '')).trim(),
        });
      });
    } else {
      exec(`${ADB_PATH} ${finalArgs.map((a) => `"${a}"`).join(' ')}`, opts, (err, stdout, stderr) => {
        resolve({
          success: !err,
          stdout: (stdout || '').trim(),
          stderr: (stderr || (err ? err.message : '')).trim(),
        });
      });
    }
  });
}

async function getConnectedDevices() {
  const res = await runAdb(['devices']);
  if (!res.success) return [];
  const lines = res.stdout.split(/\r?\n/).slice(1);
  const devices = [];
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2) devices.push({ id: parts[0], state: parts[1] });
  }
  // Prefer wireless endpoint (contains ':') over USB if both are connected
  const readyDev = devices.find((d) => d.state === 'device' && d.id.includes(':')) || devices.find((d) => d.state === 'device');
  activeDeviceId = readyDev ? readyDev.id : null;
  return devices;
}

async function isConnected() {
  const devices = await getConnectedDevices();
  return devices.some((d) => d.state === 'device');
}

async function connectPhone(host, port = 5555) {
  const cfg = _loadConfig();
  const targetHost = (host || cfg.host || '').trim();
  const targetPort = port || cfg.port || 5555;
  if (!targetHost) return { success: false, message: 'Phone IP not configured.' };
  const endpoint = `${targetHost}:${targetPort}`;
  const res = await runAdb(['connect', endpoint], 10000);
  const devices = await getConnectedDevices();
  const dev = devices.find((d) => d.id === endpoint || d.id.startsWith(targetHost));
  if (dev && dev.state === 'device') {
    cfg.host = targetHost;
    cfg.port = targetPort;
    _saveConfig(cfg);
    return { success: true, message: `Connected to phone at ${endpoint}.` };
  }
  return { success: false, message: `Could not connect to ${endpoint}. Verify Wireless Debugging is active.` };
}

async function ensureConnected() {
  const devices = await getConnectedDevices();
  if (devices.some((d) => d.state === 'device')) return true;
  if (Date.now() - _lastReconnectFailTime < 10000 || _isReconnecting) return false;
  const cfg = _loadConfig();
  if (!cfg.host) return false;
  _isReconnecting = true;
  try {
    const endpoint = `${cfg.host}:${cfg.port || 5555}`;
    const stale = devices.find((d) => d.id === endpoint && d.state === 'offline');
    if (stale) {
      await runAdb(['disconnect', endpoint], 4000);
      await sleep(300);
    }
    const res = await connectPhone(cfg.host, cfg.port);
    if (!res.success) _lastReconnectFailTime = Date.now();
    return res.success;
  } finally {
    _isReconnecting = false;
  }
}

async function isPhoneLocked() {
  const ready = await ensureConnected();
  if (!ready) return false;
  const res = await runAdb(['shell', 'dumpsys', 'window', 'policy'], 4000);
  if (res.success && res.stdout) {
    const out = res.stdout;
    if (/screenState=SCREEN_STATE_OFF/i.test(out) || /interactiveState=INTERACTIVE_STATE_ASLEEP/i.test(out)) return true;
    if (/\bshowing=true\b/i.test(out) || /\bisKeyguardShowing=true\b/i.test(out)) return true;
    if (/\bshowing=false\b/i.test(out) && /screenState=SCREEN_STATE_ON/i.test(out)) return false;
  }
  return false;
}

async function unlockPhone(customPin) {
  const cfg = _loadConfig();
  const pin = String(customPin || cfg.pin || cfg.defaultPin || '090807').trim();
  const ready = await ensureConnected();
  if (!ready) return { success: false, message: 'Phone not connected.' };
  
  // 1. Wake screen
  await runAdb(['shell', 'input', 'keyevent', '224']); // KEYCODE_WAKEUP
  await sleep(250);
  
  // 2. Dismiss keyguard
  await runAdb(['shell', 'wm', 'dismiss-keyguard']);
  await sleep(200);
  
  // 3. KEYCODE_MENU (82) triggers lockscreen unlock/PIN prompt
  await runAdb(['shell', 'input', 'keyevent', '82']);
  await sleep(200);
  
  // 4. Swipe up to reveal PIN pad if not yet open
  await runAdb(['shell', 'input', 'swipe', '540', '1900', '540', '400', '250']);
  await sleep(600);
  
  // 5. Input PIN if provided
  if (pin) {
    // Fast text injection over ADB
    await runAdb(['shell', `input text ${pin}`]);
    await sleep(200);
    await runAdb(['shell', 'input', 'keyevent', '66']); // Enter
    await sleep(400);

    // Fallback to keycodes if keyguard is still showing
    const stillLocked = await isPhoneLocked();
    if (stillLocked) {
      const keycodes = pin.split('').map((ch) => KEYCODE_DIGITS[ch]).filter(Boolean);
      if (keycodes.length > 0) {
        await runAdb(['shell', 'input', 'keyevent', ...keycodes]);
        await sleep(200);
        await runAdb(['shell', 'input', 'keyevent', '66']);
      }
    }
  }
  return { success: true, message: 'Phone unlocked.' };
}

async function lockPhone() {
  await ensureConnected();
  await runAdb(['shell', 'input', 'keyevent', 'KEYCODE_POWER']);
  return { success: true, message: 'Phone locked.' };
}

async function ensureReady(autoUnlock = true) {
  const ready = await ensureConnected();
  if (!ready) return { ready: false, message: 'Phone not connected.' };
  if (autoUnlock && (await isPhoneLocked())) {
    await unlockPhone();
    await sleep(600);
  }
  return { ready: true };
}

async function setAlarm(hour, minute, label = 'AURA Alarm') {
  await ensureReady(true);
  const args = [
    'shell', 'am', 'start',
    '-a', 'android.intent.action.SET_ALARM',
    '--ei', 'android.intent.extra.alarm.HOUR', String(hour),
    '--ei', 'android.intent.extra.alarm.MINUTES', String(minute),
    '--es', 'android.intent.extra.alarm.MESSAGE', label,
    '--ez', 'android.intent.extra.alarm.SKIP_UI', 'true',
  ];
  await runAdb(args);
  const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  return {
    success: true,
    time: formattedTime,
    label,
    message: `Alarm set for ${formattedTime}.`,
  };
}

async function callContact(targetName) {
  await ensureReady(true);
  const resolved = contactEngine.resolveContact(targetName);
  let phoneNum = '';
  let displayName = targetName;
  if (resolved && resolved.phone) {
    phoneNum = resolved.phone.replace(/[^\d+]/g, '');
    displayName = resolved.name;
  } else {
    phoneNum = (targetName || '').replace(/[^\d+]/g, '');
  }
  if (!phoneNum) {
    return { success: false, message: `Could not find phone number for "${targetName}".` };
  }
  return await callNumber(phoneNum, displayName);
}

async function callNumber(phoneNum, displayName = null) {
  await ensureReady(true);
  let name = displayName;
  let digits = (phoneNum || '').replace(/[^\d+]/g, '');
  if (!digits) {
    const resolved = contactEngine.resolveContact(phoneNum);
    if (resolved && resolved.phone) {
      digits = resolved.phone.replace(/[^\d+]/g, '');
      name = resolved.name;
    }
  }
  if (!digits) {
    return { success: false, message: `Invalid phone number or contact: "${phoneNum}"` };
  }
  const label = name ? `${name} (${digits})` : digits;

  const res = await runAdb(['shell', 'am', 'start', '-a', 'android.intent.action.CALL', '-d', `tel:${digits}`]);
  const hasSecErr = (res.stdout && res.stdout.includes('SecurityException')) || (res.stderr && res.stderr.includes('SecurityException'));
  if (!res.success || hasSecErr) {
    await runAdb(['shell', 'am', 'start', '-a', 'android.intent.action.DIAL', '-d', `tel:${digits}`]);
    await sleep(600);
    await runAdb(['shell', 'input', 'keyevent', '5']); // KEYCODE_CALL
  }
  return { success: true, message: `Calling ${label} on your phone.` };
}

async function sendWhatsAppMessage(target, message) {
  await ensureReady(true);
  let phoneNum = target;
  let contactName = target;
  const resolved = contactEngine.resolveContact(target);
  if (resolved && resolved.phone) {
    phoneNum = resolved.phone;
    contactName = resolved.name;
  }
  const cleanDigits = (phoneNum || '').replace(/[^\d]/g, '');
  const cleanMsg = (message || '').trim();
  if (!cleanDigits) {
    return { success: false, message: `Could not resolve phone number for "${target}".` };
  }

  // Deep-link directly into WhatsApp chat
  const encodedMsg = encodeURIComponent(cleanMsg);
  await runAdb(['shell', `am start -a android.intent.action.VIEW -d "whatsapp://send?phone=${cleanDigits}&text=${encodedMsg}" -p com.whatsapp`]);
  await sleep(1500);
  const sendBtn = await _getUiElementCenter('send', 1000, 2272);
  await runAdb(['shell', 'input', 'tap', String(sendBtn.cx), String(sendBtn.cy)]);
  await sleep(300);
  await runAdb(['shell', 'input', 'tap', '1000', '1415']);
  return { success: true, message: `Sent WhatsApp message to ${contactName} (${cleanDigits}).` };
}

async function _getUiElementCenter(idSubstr, fallbackX, fallbackY) {
  try {
    await runAdb(['shell', 'uiautomator', 'dump', '/sdcard/aura_ui.xml'], 5000);
    const res = await runAdb(['shell', 'cat', '/sdcard/aura_ui.xml'], 4000);
    if (res.success && res.stdout) {
      const regex = new RegExp(`resource-id="[^"]*${idSubstr}[^"]*"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`);
      const m = res.stdout.match(regex);
      if (m) {
        return {
          cx: Math.round((parseInt(m[1], 10) + parseInt(m[3], 10)) / 2),
          cy: Math.round((parseInt(m[2], 10) + parseInt(m[4], 10)) / 2),
          found: true,
        };
      }
    }
  } catch (_) {}
  return { cx: fallbackX, cy: fallbackY, found: false };
}

async function sendWhatsAppAttachment(target, attachment, caption = '') {
  await ensureReady(true);
  let phoneNum = '';
  let contactName = target;
  const resolved = contactEngine.resolveContact(target);
  if (resolved && resolved.phone) {
    phoneNum = resolved.phone.replace(/[^\d]/g, '');
    contactName = resolved.name;
  } else {
    phoneNum = (target || '').replace(/[^\d]/g, '');
  }
  if (!phoneNum || phoneNum.length < 5) {
    return { success: false, message: `Could not find phone number for "${target}".` };
  }

  let localTemp = '';
  let shouldUnlink = false;
  if (typeof attachment === 'string' && attachment && attachment !== 'recent' && attachment !== 'first_recent') {
    if (fs.existsSync(attachment)) {
      localTemp = attachment;
    } else {
      return { success: false, message: `Attachment file not found: ${attachment}` };
    }
  } else if (attachment && typeof attachment === 'object') {
    const ext = attachment.filename ? path.extname(attachment.filename) : (attachment.name ? path.extname(attachment.name) : '.jpg');
    localTemp = path.join(os.tmpdir(), `aura_share_${Date.now()}${ext || '.jpg'}`);
    shouldUnlink = true;
    if (attachment.base64) {
      fs.writeFileSync(localTemp, Buffer.from(attachment.base64, 'base64'));
    } else if (attachment.dataUrl) {
      fs.writeFileSync(localTemp, Buffer.from(attachment.dataUrl.split(',')[1], 'base64'));
    } else if (attachment.filepath && fs.existsSync(attachment.filepath)) {
      fs.copyFileSync(attachment.filepath, localTemp);
    } else {
      return { success: false, message: 'Invalid attachment data format.' };
    }
  }

  // If we have a local file to stage, push it to phone Pictures & Download and register in MediaStore
  if (localTemp && fs.existsSync(localTemp)) {
    const ext = path.extname(localTemp) || '.jpg';
    const remoteFileName = `aura_share_${Date.now()}${ext}`;
    const picPath = `/sdcard/Pictures/${remoteFileName}`;
    const dlPath = `/sdcard/Download/${remoteFileName}`;

    console.log(`[WhatsApp Media] Pushing media to phone Pictures: ${picPath}`);
    await runAdb(['push', localTemp, picPath]);
    await runAdb(['push', localTemp, dlPath]);
    if (shouldUnlink) {
      try { fs.unlinkSync(localTemp); } catch (_) {}
    }

    // Force Android MediaScanner to index into Recents immediately
    await runAdb(['shell', 'am', 'broadcast', '-a', 'android.intent.action.MEDIA_SCANNER_SCAN_FILE', '-d', `file://${picPath}`]);
    await runAdb(['shell', 'am', 'broadcast', '-a', 'android.intent.action.MEDIA_SCANNER_SCAN_FILE', '-d', `file://${dlPath}`]);
    await sleep(700);
  }

  // 1. Deep-link directly into WhatsApp conversation for contact
  console.log(`[WhatsApp Media] Opening WhatsApp chat for ${contactName} (${phoneNum})...`);
  await runAdb(['shell', `am start -a android.intent.action.VIEW -d "whatsapp://send?phone=${phoneNum}" -p com.whatsapp`]);
  await sleep(1500);

  // Ensure soft keyboard is dismissed on initial chat open so attach button is accessible
  try {
    const initK = await runAdb(['shell', 'dumpsys', 'input_method'], 2000);
    if (initK.success && /mInputShown=true/i.test(initK.stdout)) {
      await runAdb(['shell', 'input', 'keyevent', 'KEYCODE_BACK']);
      await sleep(350);
    }
  } catch (_) {}

  // 2. Find and tap Attach button (paperclip)
  let attachBtn = await _getUiElementCenter('input_attach_button', 635, 2275);
  if (attachBtn.cy < 1600) {
    await runAdb(['shell', 'input', 'keyevent', 'KEYCODE_BACK']);
    await sleep(350);
    attachBtn = await _getUiElementCenter('input_attach_button', 635, 2275);
  }
  console.log(`[WhatsApp Media] Tapping Attach button at (${attachBtn.cx}, ${attachBtn.cy})...`);
  await runAdb(['shell', 'input', 'tap', String(attachBtn.cx), String(attachBtn.cy)]);
  await sleep(1000);

  // 3. Select the first file from Recent section
  const mediaItem = await _getUiElementCenter('media_item_view', 404, 2025);
  console.log(`[WhatsApp Media] Selecting first recent photo at (${mediaItem.cx}, ${mediaItem.cy})...`);
  await runAdb(['shell', 'input', 'tap', String(mediaItem.cx), String(mediaItem.cy)]);
  await sleep(1200);

  // 4. If caption is specified, type it into the caption field
  let isKeyboardOpenForCaption = false;
  if (caption && caption.trim()) {
    const captionBox = await _getUiElementCenter('caption', 496, 2266);
    console.log(`[WhatsApp Media] Tapping caption box at (${captionBox.cx}, ${captionBox.cy}) for caption: "${caption.trim()}"`);
    await runAdb(['shell', 'input', 'tap', String(captionBox.cx), String(captionBox.cy)]);
    await sleep(500);
    const cleanCap = caption.trim();
    const escaped = cleanCap.replace(/ /g, '%s').replace(/["'&$#()<>|;*`\\]/g, '');
    if (escaped) {
      await runAdb(['shell', 'input', 'text', escaped]);
      await sleep(500);
      isKeyboardOpenForCaption = true;
    }
  }

  // 5. Tap Send Media button (do NOT press KEYCODE_BACK as it dismisses/collapses the media picker!)
  // When the soft keyboard is open, the Send Media button sits anchored directly above the keyboard at Y=1409.
  const fallbackY = isKeyboardOpenForCaption ? 1409 : 2266;
  const sendBtn = await _getUiElementCenter('send_media_btn', 1003, fallbackY);
  console.log(`[WhatsApp Media] Tapping Send Media button at (${sendBtn.cx}, ${sendBtn.cy})...`);
  await runAdb(['shell', 'input', 'tap', String(sendBtn.cx), String(sendBtn.cy)]);
  await sleep(800);

  return { success: true, message: `Sent photo attachment to ${contactName} on WhatsApp.` };
}

async function searchYouTubeOnPhone(query, autoPlayIndex = 1) {
  await ensureReady(true);
  let cleanQ = (query || '').trim();
  if (!cleanQ || /^trending(?:\s+songs?|\s+chat|\s+playlist)?$/i.test(cleanQ)) {
    cleanQ = 'trending songs in tamil';
  }
  console.log(`[YouTube] Searching for: "${cleanQ}" (Target Result: #${autoPlayIndex})`);
  _phoneState.lastActiveApp = 'youtube';
  _phoneState.lastResultsApp = 'youtube';
  _phoneState.lastQuery = cleanQ;
  _phoneState.lastActionTimestamp = Date.now();

  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQ)}`;
  await runAdb([
    'shell',
    'am',
    'start',
    '-a',
    'android.intent.action.VIEW',
    '-d',
    url,
    '-p',
    'com.google.android.youtube',
  ]);

  if (autoPlayIndex) {
    await sleep(2800); // Buffer for network fetch & layout rendering
    return await selectYouTubeVideo(autoPlayIndex);
  }
  return { success: true, message: `Searching YouTube for "${cleanQ}" on your phone.` };
}

async function selectYouTubeVideo(index = 1) {
  await ensureReady(true);
  const idx = Math.max(1, parseInt(index, 10) || 1);
  console.log(`[YouTube] Selecting video result #${idx}...`);

  // Wake screen if display timed out
  await runAdb(['shell', 'input', 'keyevent', '224']);
  await sleep(200);

  // If user asked for result #3 or higher, scroll down to reveal
  if (idx > 2) {
    const swipes = Math.floor((idx - 1) / 2);
    for (let s = 0; s < swipes; s++) {
      console.log(`[YouTube] Scrolling feed (swipe ${s + 1}/${swipes})...`);
      await runAdb(['shell', 'input', 'swipe', '540', '1800', '540', '600', '350']);
      await sleep(600);
    }
  }

  // Calculate target tap coordinates based on 1080x2392 screen geometry
  const tapX = 540;
  let tapY = 560;
  if (idx === 1) {
    tapY = 560; // Result #1 center
  } else if (idx === 2) {
    tapY = 1450; // Result #2 center
  } else {
    const relIdx = ((idx - 1) % 2) + 1;
    tapY = relIdx === 1 ? 800 : 1600;
  }

  console.log(`[YouTube] Tapping Video #${idx} at physical screen coordinates (${tapX}, ${tapY})`);
  await runAdb(['shell', `input tap ${tapX} ${tapY}`]);

  _phoneState.lastActiveApp = 'youtube';
  _phoneState.lastResultsApp = null;
  _phoneState.isPlayingVideo = true;
  _phoneState.isPaused = false;
  _phoneState.lastActionTimestamp = Date.now();

  const ordinalWords = ['first', 'second', 'third', 'fourth', 'fifth'];
  const ordText = ordinalWords[idx - 1] || `${idx}th`;
  return { success: true, message: `Playing the ${ordText} result on YouTube on your phone.` };
}

async function playSpotifyOnPhone(query) {
  await ensureReady(true);
  const url = `spotify:search:${encodeURIComponent(query.trim())}`;
  await runAdb(['shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', url]);
  return { success: true, message: `Playing "${query}" on Spotify.` };
}

async function controlMedia(action, level = null) {
  await ensureReady(true);
  const act = (action || '').toLowerCase().trim();
  await runAdb(['shell', 'input', 'keyevent', '224']); // Wake

  if (act === 'volume_set' || level !== null) {
    const raw = parseInt(level !== null ? level : 50, 10);
    const idx = Math.min(15, Math.max(0, Math.round(15 * (raw / 100))));
    _lastVolumeIndex = idx || 8;
    await runAdb(['shell', `cmd audio set-volume 3 ${idx}`]);
    return { success: true, message: `Set phone media volume to ${raw}%.` };
  }
  if (act === 'mute') {
    await runAdb(['shell', 'cmd audio adj-mute 3']);
    return { success: true, message: 'Muted phone.' };
  }
  if (act === 'unmute') {
    await runAdb(['shell', `cmd audio adj-unmute 3; cmd audio set-volume 3 ${_lastVolumeIndex || 8}`]);
    return { success: true, message: 'Unmuted phone.' };
  }
  if (act === 'volume_up') {
    await runAdb(['shell', 'cmd media_session volume --stream 3 --adj raise || input keyevent 24']);
    return { success: true, message: 'Increased volume on phone.' };
  }
  if (act === 'volume_down') {
    await runAdb(['shell', 'cmd media_session volume --stream 3 --adj lower || input keyevent 25']);
    return { success: true, message: 'Decreased volume on phone.' };
  }
  if (act === 'play' || act === 'resume') {
    // If user searched without picking a video, pick #1
    if (_phoneState.lastResultsApp === 'youtube' && !_phoneState.isPlayingVideo) {
      return await selectYouTubeVideo(1);
    }
    await runAdb(['shell', 'cmd media_session dispatch play; input keyevent 126; input keyevent 85']);
    _phoneState.isPlayingVideo = true;
    _phoneState.isPaused = false;
    return { success: true, message: 'Resumed YouTube playback on your phone.' };
  }
  if (act === 'pause' || act === 'stop') {
    await runAdb(['shell', 'cmd media_session dispatch pause; input keyevent 127; input keyevent 85']);
    _phoneState.isPlayingVideo = false;
    _phoneState.isPaused = true;
    return { success: true, message: 'Paused YouTube playback on your phone.' };
  }
  if (act === 'next') {
    await runAdb(['shell', 'cmd media_session dispatch next; input keyevent 87']);
    return { success: true, message: 'Skipped to next track on phone.' };
  }
  if (act === 'prev') {
    await runAdb(['shell', 'cmd media_session dispatch previous; input keyevent 88']);
    return { success: true, message: 'Playing previous track on phone.' };
  }
  if (act === 'forward_10' || act.includes('forward') || act.includes('skip 10')) {
    await runAdb(['shell', 'input tap 800 560; sleep 0.05; input tap 800 560; cmd media_session dispatch fast-forward']);
    return { success: true, message: 'Skipped forward 10 seconds on your phone.' };
  }
  if (act === 'rewind_10' || act.includes('rewind') || act.includes('back 10')) {
    await runAdb(['shell', 'input tap 280 560; sleep 0.05; input tap 280 560; cmd media_session dispatch rewind']);
    return { success: true, message: 'Rewound 10 seconds on your phone.' };
  }
  await runAdb(['shell', 'input', 'keyevent', '85']);
  return { success: true, message: 'Toggled media on phone.' };
}

const controlYouTubeMedia = controlMedia;

async function capturePhoto(isFront = false) {
  await ensureReady(true);
  const shellCmd = isFront
    ? 'input keyevent 224 && am start -W -a android.media.action.STILL_IMAGE_CAMERA --ez android.intent.extra.USE_FRONT_CAMERA true --ei android.intent.extras.CAMERA_FACING 1 && sleep 0.35 && input tap 973 2022 && sleep 0.35 && input keyevent 25 && sleep 0.25 && input keyevent 3'
    : 'input keyevent 224 && am start -W -a android.media.action.STILL_IMAGE_CAMERA && sleep 0.45 && input keyevent 25 && sleep 0.25 && input keyevent 3';
  await runAdb(['shell', shellCmd]);
  return {
    success: true,
    type: isFront ? 'selfie_front' : 'photo_rear',
    message: isFront ? 'Snapped a selfie.' : 'Captured a photo.',
  };
}

async function getBattery() {
  await ensureConnected();
  const res = await runAdb(['shell', 'dumpsys', 'battery']);
  let level = 85, status = 'discharging', ac = false, usb = false, temp = 31.5;
  if (res.success && res.stdout) {
    for (const line of res.stdout.split(/\r?\n/)) {
      const l = line.trim();
      if (l.startsWith('level:')) level = parseInt(l.split(':')[1].trim(), 10);
      if (l.startsWith('temperature:')) temp = parseInt(l.split(':')[1].trim(), 10) / 10;
      if (l.startsWith('status:')) {
        const s = parseInt(l.split(':')[1].trim(), 10);
        status = s === 2 ? 'charging' : s === 5 ? 'full' : 'discharging';
      }
      if (l.startsWith('AC powered:') && l.includes('true')) ac = true;
      if (l.startsWith('USB powered:') && l.includes('true')) usb = true;
    }
  }
  return {
    success: true,
    level,
    batteryPercent: level,
    temperatureC: temp,
    isCharging: status === 'charging' || ac || usb,
    status,
  };
}

async function takeScreenshot() {
  await ensureReady(true);
  const ts = Date.now();
  const remotePath = `/sdcard/Download/screen_${ts}.png`;
  const localDir = path.join(process.env.USERPROFILE || process.env.HOME, 'Desktop', 'Phone_Screenshots');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
  const localPath = path.join(localDir, `phone_${ts}.png`);
  await runAdb(['shell', 'screencap', '-p', remotePath]);
  await runAdb(['pull', remotePath, localPath]);
  await runAdb(['shell', 'rm', remotePath]);
  return { success: true, localPath, message: 'Screenshot saved to Desktop.' };
}

async function searchOnPhone(query, appHint = null) {
  const cleanQ = query.trim();
  const lower = cleanQ.toLowerCase();
  if (appHint === 'whatsapp' || /\b(?:on|in)\s+whatsapp\b/i.test(lower)) {
    return await sendWhatsAppMessage('9876543210', cleanQ.replace(/\b(?:on|in)\s+whatsapp\b/i, '').trim());
  }
  if (appHint === 'youtube' || /\b(?:on|in)\s+youtube\b/i.test(lower)) {
    return await searchYouTubeOnPhone(cleanQ.replace(/\b(?:on|in)\s+youtube\b/i, '').trim());
  }
  if (appHint === 'spotify' || /\b(?:on|in)\s+spotify\b/i.test(lower)) {
    return await playSpotifyOnPhone(cleanQ.replace(/\b(?:on|in)\s+spotify\b/i, '').trim());
  }
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(cleanQ)}`;
  await runAdb(['shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', searchUrl, '-p', 'com.android.chrome']);
  return { success: true, message: `Searching Chrome for "${cleanQ}".` };
}

let _recordingSession = null;

async function saveFileToPhone(sourcePath, customName = '') {
  await ensureReady(true);
  let localFile = sourcePath;
  let shouldUnlink = false;

  if (typeof sourcePath === 'object' && sourcePath) {
    const ext = sourcePath.name ? path.extname(sourcePath.name) : (sourcePath.filename ? path.extname(sourcePath.filename) : '.jpg');
    localFile = path.join(os.tmpdir(), `aura_save_${Date.now()}${ext || '.jpg'}`);
    shouldUnlink = true;
    if (sourcePath.base64) {
      fs.writeFileSync(localFile, Buffer.from(sourcePath.base64, 'base64'));
    } else if (sourcePath.dataUrl) {
      fs.writeFileSync(localFile, Buffer.from(sourcePath.dataUrl.split(',')[1], 'base64'));
    } else if (sourcePath.filepath && fs.existsSync(sourcePath.filepath)) {
      fs.copyFileSync(sourcePath.filepath, localFile);
    }
  }

  if (!localFile || !fs.existsSync(localFile)) {
    return { success: false, message: `Local source file not found: ${sourcePath}` };
  }

  const ext = path.extname(localFile) || '.jpg';
  const cleanName = (customName || `aura_saved_${Date.now()}`).replace(/[^\w.-]/g, '_');
  const finalFilename = cleanName.endsWith(ext) ? cleanName : `${cleanName}${ext}`;

  const picPath = `/sdcard/Pictures/${finalFilename}`;
  const dlPath = `/sdcard/Download/${finalFilename}`;

  console.log(`[PhoneEngine] Saving file to phone: ${picPath}`);
  await runAdb(['push', localFile, picPath]);
  await runAdb(['push', localFile, dlPath]);

  // Trigger MediaScanner so it instantly appears in Android Gallery and Recents
  await runAdb(['shell', 'am', 'broadcast', '-a', 'android.intent.action.MEDIA_SCANNER_SCAN_FILE', '-d', `file://${picPath}`]);
  await runAdb(['shell', 'am', 'broadcast', '-a', 'android.intent.action.MEDIA_SCANNER_SCAN_FILE', '-d', `file://${dlPath}`]);

  if (shouldUnlink) {
    try { fs.unlinkSync(localFile); } catch (_) {}
  }

  return {
    success: true,
    remotePath: picPath,
    downloadPath: dlPath,
    filename: finalFilename,
    message: `Image saved to phone Gallery (/sdcard/Pictures/${finalFilename}) and Downloads.`,
  };
}

async function startScreenRecording(customName = '') {
  await ensureReady(true);
  if (_recordingSession && _recordingSession.active) {
    return { success: true, message: 'Screen recording is already active on phone.' };
  }

  const ts = Date.now();
  const remotePath = `/sdcard/Download/aura_record_${ts}.mp4`;
  console.log(`[ScreenRecord] Starting screen recording on phone -> ${remotePath}`);

  // Launch screenrecord in background on Android
  const { spawn } = require('child_process');
  let adbArgs = ['shell', 'screenrecord', '--bit-rate', '4M', remotePath];
  if (activeDeviceId) adbArgs = ['-s', activeDeviceId, ...adbArgs];

  const child = spawn(ADB_PATH, adbArgs, { detached: true, stdio: 'ignore' });
  child.unref();

  _recordingSession = {
    active: true,
    startTime: ts,
    remotePath,
    customName: customName || `screen_record_${ts}`,
    child,
  };

  // Give screenrecord 300ms to initialize
  await sleep(300);

  return {
    success: true,
    remotePath,
    message: 'Screen recording started on your phone. Say "finish record" or "stop recording" when done.',
  };
}

async function stopScreenRecording() {
  await ensureConnected();
  if (!_recordingSession || !_recordingSession.active) {
    // Check if there is an orphan screenrecord running on the device
    const pids = await runAdb(['shell', 'pidof', 'screenrecord']);
    if (pids.success && pids.stdout) {
      console.log(`[ScreenRecord] Stopping orphaned screenrecord PID: ${pids.stdout.trim()}`);
      await runAdb(['shell', 'kill', '-2', pids.stdout.trim()]);
      await sleep(1200);
      return { success: true, message: 'Stopped background screen recording on phone.' };
    }
    return { success: false, message: 'No active screen recording found.' };
  }

  const session = _recordingSession;
  _recordingSession = null;
  const durationSec = Math.round((Date.now() - session.startTime) / 1000);

  console.log(`[ScreenRecord] Stopping screen recording after ${durationSec}s...`);

  // Send SIGINT (-2) to screenrecord so it finalizes the MP4 moov atom
  const pids = await runAdb(['shell', 'pidof', 'screenrecord']);
  if (pids.success && pids.stdout) {
    await runAdb(['shell', 'kill', '-2', pids.stdout.trim()]);
  } else if (session.child) {
    try { session.child.kill('SIGINT'); } catch (_) {}
  }

  // Wait 1.2s for video encoder to flush and close file
  await sleep(1200);

  // Pull recorded video to PC Downloads/AURA_Recordings/
  const userProfile = process.env.USERPROFILE || process.env.HOME || '';
  const localDir = path.join(userProfile, 'Downloads', 'AURA_Recordings');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });

  const localFile = path.join(localDir, `${session.customName}.mp4`);
  console.log(`[ScreenRecord] Pulling recording to PC: ${localFile}`);
  await runAdb(['pull', session.remotePath, localFile], 20000);

  // Broadcast to MediaStore so phone also sees it
  await runAdb(['shell', 'am', 'broadcast', '-a', 'android.intent.action.MEDIA_SCANNER_SCAN_FILE', '-d', `file://${session.remotePath}`]);

  return {
    success: true,
    durationSeconds: durationSec,
    localPath: localFile,
    remotePath: session.remotePath,
    message: `Screen recording finished (${durationSec}s). Video saved to Downloads\\AURA_Recordings\\${session.customName}.mp4 and phone.`,
  };
}

async function setPhoneBrightness(percentage) {
  await ensureReady(true);
  const pct = Math.min(100, Math.max(0, parseInt(percentage !== undefined ? percentage : 50, 10)));
  const rawVal = Math.round((pct / 100) * 255);
  console.log(`[PhoneEngine] Setting brightness to ${pct}% (raw: ${rawVal})`);
  await runAdb(['shell', 'settings', 'put', 'system', 'screen_brightness', String(rawVal)]);
  return {
    success: true,
    percentage: pct,
    rawValue: rawVal,
    message: `Set phone screen brightness to ${pct}%.`,
  };
}

async function setPhoneVolume(percentage) {
  await ensureReady(true);
  const pct = Math.min(100, Math.max(0, parseInt(percentage !== undefined ? percentage : 50, 10)));
  const idx = Math.min(15, Math.max(0, Math.round(15 * (pct / 100))));
  _lastVolumeIndex = idx;
  console.log(`[PhoneEngine] Setting volume to ${pct}% (index: ${idx}/15)`);

  // Stream 3: Media/Music, Stream 2: Ring, Stream 5: Notification
  await runAdb(['shell', `cmd audio set-volume 3 ${idx}`]);
  await runAdb(['shell', `cmd audio set-volume 2 ${idx}`]);
  await runAdb(['shell', `cmd audio set-volume 5 ${idx}`]);

  if (pct === 0) {
    await runAdb(['shell', 'cmd audio adj-mute 3; cmd audio adj-mute 2; cmd audio adj-mute 5']);
  } else {
    await runAdb(['shell', 'cmd audio adj-unmute 3; cmd audio adj-unmute 2; cmd audio adj-unmute 5']);
  }

  return {
    success: true,
    percentage: pct,
    volumeIndex: idx,
    message: `Set phone volume to ${pct}%.`,
  };
}

async function setPhoneRingerMode(mode) {
  await ensureReady(true);
  const cleanMode = (mode || '').toLowerCase().trim();
  console.log(`[PhoneEngine] Setting ringer mode: ${cleanMode}`);

  if (cleanMode === 'mute' || cleanMode === 'silent') {
    await runAdb(['shell', 'settings put global mode_ringer 0; cmd audio adj-mute 3; cmd audio adj-mute 2; cmd audio adj-mute 5; cmd audio set-volume 3 0; cmd audio set-volume 2 0; cmd audio set-volume 5 0']);
    return { success: true, mode: 'silent', message: 'Put phone in Silent/Mute mode.' };
  }

  if (cleanMode === 'vibrate' || cleanMode === 'vibration') {
    await runAdb(['shell', 'settings put global mode_ringer 1; cmd audio set-volume 2 0; cmd audio adj-mute 2']);
    return { success: true, mode: 'vibration', message: 'Put phone in Vibration mode.' };
  }

  // Unmute / Normal
  await runAdb(['shell', `settings put global mode_ringer 2; cmd audio adj-unmute 3; cmd audio adj-unmute 2; cmd audio adj-unmute 5; cmd audio set-volume 3 ${_lastVolumeIndex || 8}; cmd audio set-volume 2 8; cmd audio set-volume 5 8`]);
  return { success: true, mode: 'normal', message: 'Unmuted phone (Normal ringer mode active).' };
}

async function toggleQuickSetting(setting, state = null) {
  await ensureReady(true);
  const s = (setting || '').toLowerCase().trim();
  const st = state !== null ? String(state).toLowerCase().trim() : 'on';
  const isEnable = st === 'on' || st === 'enable' || st === 'true' || st === 'yes' || st === '1';

  console.log(`[PhoneEngine] Quick setting toggle: "${s}" -> state: "${st}" (enable=${isEnable})`);

  if (s === 'wifi' || s === 'wi-fi') {
    await runAdb(['shell', 'svc', 'wifi', isEnable ? 'enable' : 'disable']);
    return { success: true, setting: 'wifi', state: isEnable ? 'enabled' : 'disabled', message: `${isEnable ? 'Enabled' : 'Disabled'} Wi-Fi on phone.` };
  }

  if (s === 'bluetooth' || s === 'bt') {
    await runAdb(['shell', 'cmd', 'bluetooth_manager', isEnable ? 'enable' : 'disable']);
    return { success: true, setting: 'bluetooth', state: isEnable ? 'enabled' : 'disabled', message: `${isEnable ? 'Enabled' : 'Disabled'} Bluetooth on phone.` };
  }

  if (s === 'data' || s === 'internet' || s === 'mobile_data' || s === 'cellular') {
    await runAdb(['shell', 'svc', 'data', isEnable ? 'enable' : 'disable']);
    return { success: true, setting: 'mobile_data', state: isEnable ? 'enabled' : 'disabled', message: `${isEnable ? 'Enabled' : 'Disabled'} Mobile Data / Internet on phone.` };
  }

  if (s === 'location' || s === 'gps') {
    await runAdb(['shell', 'cmd', 'location', 'set-location-enabled', isEnable ? 'true' : 'false']);
    return { success: true, setting: 'location', state: isEnable ? 'enabled' : 'disabled', message: `${isEnable ? 'Turned on' : 'Turned off'} Location on phone.` };
  }

  if (s === 'dnd' || s === 'do_not_disturb' || s === 'zen') {
    await runAdb(['shell', 'settings', 'put', 'global', 'zen_mode', isEnable ? '1' : '0']);
    return { success: true, setting: 'dnd', state: isEnable ? 'enabled' : 'disabled', message: `${isEnable ? 'Turned on' : 'Turned off'} Do Not Disturb (DND) mode on phone.` };
  }

  if (s === 'theme' || s === 'dark_theme' || s === 'light_theme' || s === 'night_mode' || s === 'dark_mode') {
    const isDark = isEnable || s.includes('dark') || st === 'dark';
    await runAdb(['shell', 'cmd', 'uimode', 'night', isDark ? 'yes' : 'no']);
    return { success: true, setting: 'theme', state: isDark ? 'dark' : 'light', message: `Changed phone theme to ${isDark ? 'Dark' : 'Light'} mode.` };
  }

  if (s === 'autorotate' || s === 'auto_rotate' || s === 'rotation') {
    await runAdb(['shell', 'settings', 'put', 'system', 'accelerometer_rotation', isEnable ? '1' : '0']);
    return { success: true, setting: 'autorotate', state: isEnable ? 'enabled' : 'disabled', message: `${isEnable ? 'Enabled' : 'Disabled'} Auto-rotate on phone.` };
  }

  if (s === 'flashlight' || s === 'torch') {
    // Expand Quick Settings, tap verified Torch tile at (882, 1405), then collapse
    await runAdb(['shell', 'cmd', 'statusbar', 'expand-settings']);
    await sleep(600);
    await runAdb(['shell', 'input', 'tap', '882', '1405']);
    await sleep(350);
    await runAdb(['shell', 'cmd', 'statusbar', 'collapse']);
    return { success: true, setting: 'flashlight', message: 'Toggled Flashlight/Torch on phone.' };
  }

  return { success: false, message: `Unknown quick setting: "${setting}"` };
}

class PhoneEngine {
  constructor() {
    this.config = _loadConfig();
    this.adbPath = ADB_PATH;
    this.lastReconnectFailTime = 0;
  }
  getBattery() { return getBattery(); }
  setAlarm(h, m, l) { return setAlarm(h, m, l); }
  callNumber(p) { return callNumber(p); }
  callContact(c) { return callContact(c); }
  makePhoneCall(p) { return callNumber(p); }
  sendWhatsAppMessage(p, m) { return sendWhatsAppMessage(p, m); }
  sendWhatsAppMedia(p, f, c) { return sendWhatsAppAttachment(p, f, c); }
  searchAndPlayYouTube(q, i) { return searchYouTubeOnPhone(q, i); }
  selectYouTubeVideo(index) { return selectYouTubeVideo(index); }
  playSpotify(q) { return playSpotifyOnPhone(q); }
  mediaControl(a, v) { return controlMedia(a, v); }
  controlYouTubeMedia(a, v) { return controlYouTubeMedia(a, v); }
  takePhoto(front) { return capturePhoto(front); }
  takeCameraPhoto(front) { return capturePhoto(front); }
  unlockDevice(pin) { return unlockPhone(pin); }
  lockDevice() { return lockPhone(); }
  takeScreenshot() { return takeScreenshot(); }
  syncContactsFromDevice() { return contactEngine.syncPhoneContacts(); }
  saveFileToPhone(f, n) { return saveFileToPhone(f, n); }
  startScreenRecording(n) { return startScreenRecording(n); }
  stopScreenRecording() { return stopScreenRecording(); }
  setPhoneBrightness(p) { return setPhoneBrightness(p); }
  setPhoneVolume(p) { return setPhoneVolume(p); }
  setPhoneRingerMode(m) { return setPhoneRingerMode(m); }
  toggleQuickSetting(s, st) { return toggleQuickSetting(s, st); }

  async launchApp(app) {
    await ensureReady(true);
    const cleanApp = (app || '').toLowerCase().trim();

    // Universal Camera Intent
    if (cleanApp === 'camera' || cleanApp === 'cam') {
      const camRes = await runAdb(['shell', 'am', 'start', '-a', 'android.media.action.STILL_IMAGE_CAMERA']);
      if (camRes.success) {
        return { success: true, app: 'camera', package: 'com.android.camera', message: 'Launched Camera on phone' };
      }
    }

    const builtInPackages = {
      whatsapp: 'com.whatsapp',
      youtube: 'com.google.android.youtube',
      yt: 'com.google.android.youtube',
      spotify: 'com.spotify.music',
      camera: 'com.android.camera',
      cam: 'com.android.camera',
      'free fire': 'com.dts.freefiremax',
      freefire: 'com.dts.freefiremax',
      'free fire max': 'com.dts.freefiremax',
      freefiremax: 'com.dts.freefiremax',
      ff: 'com.dts.freefiremax',
      chrome: 'com.android.chrome',
      browser: 'com.android.chrome',
      instagram: 'com.instagram.android',
      insta: 'com.instagram.android',
      settings: 'com.android.settings',
      gallery: 'com.google.android.apps.photos',
      photos: 'com.google.android.apps.photos',
      maps: 'com.google.android.apps.maps',
      clock: 'com.google.android.deskclock',
      calculator: 'com.google.android.calculator',
      telegram: 'org.telegram.messenger',
      gmail: 'com.google.android.gm',
      playstore: 'com.android.vending',
      'play store': 'com.android.vending',
    };

    const cfg = _loadConfig();
    let pkg = (cfg.packageMap && cfg.packageMap[cleanApp]) ||
              (cfg.packages && cfg.packages[cleanApp]) ||
              (this.config?.packageMap && this.config.packageMap[cleanApp]) ||
              (this.config?.packages && this.config.packages[cleanApp]) ||
              builtInPackages[cleanApp];

    // If still not found, search installed packages dynamically
    if (!pkg && cleanApp) {
      const searchKey = cleanApp.replace(/\s+/g, '');
      const pmRes = await runAdb(['shell', 'pm', 'list', 'packages']);
      if (pmRes.success && pmRes.stdout) {
        const lines = pmRes.stdout.split(/\r?\n/).map(l => l.replace(/^package:/, '').trim());
        const match = lines.find(p => p.toLowerCase().includes(searchKey) || p.toLowerCase().includes(cleanApp));
        if (match) pkg = match;
      }
    }

    pkg = pkg || app;
    const res = await runAdb(['shell', 'monkey', '-p', pkg, '-c', 'android.intent.category.LAUNCHER', '1']);
    if (!res.success || (res.stdout && res.stdout.includes('No activities found to run'))) {
      await runAdb(['shell', 'monkey', '-p', pkg, '1']);
    }
    return { success: true, app, package: pkg, message: `Launched ${app} on Android device` };
  }
  async aiCallMessage(contact, message) {
    await callNumber(contact);
    return { success: true, contact, synthesizedMessage: message, message: `Dispatched AI call to ${contact}` };
  }
  async connectWireless(host, port) {
    if (Date.now() - this.lastReconnectFailTime < 10000) {
      return { connected: false, status: 'COOLDOWN_ACTIVE' };
    }
    const res = await connectPhone(host, port);
    if (!res.success) this.lastReconnectFailTime = Date.now();
    return res;
  }
}

const phoneEngine = new PhoneEngine();

module.exports = {
  runAdb,
  getConnectedDevices,
  isConnected,
  connectPhone,
  ensureConnected,
  isPhoneLocked,
  unlockPhone,
  lockPhone,
  ensureReady,
  setAlarm,
  callNumber,
  callContact,
  sendWhatsAppMessage,
  sendWhatsAppAttachment,
  sendWhatsAppMedia: sendWhatsAppAttachment,
  searchYouTubeOnPhone,
  selectYouTubeVideo,
  playSpotifyOnPhone,
  controlMedia,
  controlYouTubeMedia,
  capturePhoto,
  captureSelfie: () => capturePhoto(true),
  getBattery,
  takeScreenshot,
  searchOnPhone,
  syncPhoneContacts: contactEngine.syncPhoneContacts,
  saveFileToPhone,
  startScreenRecording,
  stopScreenRecording,
  setPhoneBrightness,
  setPhoneVolume,
  setPhoneRingerMode,
  toggleQuickSetting,
  PhoneEngine,
  phoneEngine,
  KEYCODE_DIGITS,
};
