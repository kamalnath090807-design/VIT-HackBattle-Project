// main.js — AURA Floating Chat Box Subsystem
'use strict';

const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path');

let chatWindow = null;
let automationTarget = 'pc'; // 'pc' | 'mobile'
let automationMode = 'AUTO'; // 'AUTO' | 'SUPERVISED'

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (chatWindow && !chatWindow.isDestroyed()) {
      if (chatWindow.isMinimized()) chatWindow.restore();
      chatWindow.setAlwaysOnTop(true, 'screen-saver', 1);
      chatWindow.show();
      chatWindow.focus();
      chatWindow.webContents.send('aura:focus-input');
    }
  });
}

function createChatWindow() {
  if (chatWindow && !chatWindow.isDestroyed()) {
    if (chatWindow.isMinimized()) chatWindow.restore();
    chatWindow.show();
    chatWindow.focus();
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const w = 480;
  const h = 540;

  // Positioned at top-right of screen by default
  const defaultX = Math.round(screenWidth - w - 24);
  const defaultY = Math.round(screenHeight * 0.12);

  chatWindow = new BrowserWindow({
    width: w,
    height: h,
    x: defaultX,
    y: defaultY,
    minWidth: 420,
    minHeight: 420,
    frame: false,
    transparent: true,
    hasShadow: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Stays pinned over fullscreen applications without disrupting focus
  chatWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  chatWindow.loadFile(path.join(__dirname, 'renderer', 'chat.html'));

  chatWindow.once('ready-to-show', () => {
    chatWindow.show();
    chatWindow.focus();
  });

  chatWindow.on('closed', () => {
    chatWindow = null;
  });
}

app.whenReady().then(() => {
  createChatWindow();

  const toggleChat = () => {
    if (!chatWindow || chatWindow.isDestroyed()) {
      createChatWindow();
      return;
    }
    if (chatWindow.isVisible()) {
      chatWindow.hide();
    } else {
      if (chatWindow.isMinimized()) chatWindow.restore();
      chatWindow.setAlwaysOnTop(true, 'screen-saver', 1);
      chatWindow.show();
      chatWindow.focus();
      chatWindow.webContents.send('aura:focus-input');
    }
  };

  // Registers Shift+Z (user requested) and Ctrl+Space to toggle the chat box
  globalShortcut.register('Shift+Z', toggleChat);
  globalShortcut.register('CommandOrControl+Space', toggleChat);

  console.log('\n======================================================');
  console.log('  ✦ AURA Autonomous Agent — Desktop HUD Active ✦     ');
  console.log('======================================================');
  console.log(`[AURA] Process PID: ${process.pid}`);
  console.log('[AURA] Global Shortcuts Active:');
  console.log('       • Shift + Z      -> Toggle Floating Chat Window');
  console.log('       • Ctrl + Space   -> Toggle Floating Chat Window');
  console.log('[AURA] Status: Running and ready for commands!');
  console.log('------------------------------------------------------');
  console.log('ℹ️  NOTE: This terminal process powers the active HUD.');
  console.log('   Keep this terminal open while using the chat window.');
  console.log('======================================================\n');
});

// ── Window Control & Mode IPC Handlers ────────────────────────────────────────
ipcMain.on('aura:close-chatbox', () => {
  if (chatWindow && !chatWindow.isDestroyed()) chatWindow.hide();
});

ipcMain.on('aura:minimize-chatbox', () => {
  if (chatWindow && !chatWindow.isDestroyed()) chatWindow.minimize();
});

ipcMain.on('aura:set-automation-target', (event, target) => {
  automationTarget = target === 'mobile' ? 'mobile' : 'pc';
  const intentEngine = require('./core/intentEngine');
  intentEngine.setTarget(automationTarget);
  if (chatWindow && !chatWindow.isDestroyed()) {
    chatWindow.webContents.send('aura:automation-target-changed', automationTarget);
  }
});

ipcMain.handle('aura:get-automation-target', () => automationTarget);

ipcMain.on('aura:set-automation-mode', (event, mode) => {
  automationMode = mode === 'SUPERVISED' ? 'SUPERVISED' : 'AUTO';
});

ipcMain.handle('aura:get-automation-mode', () => automationMode);

// Screen Analysis & Crop Bridges
ipcMain.on('aura:analyze-screen', async (event, q) => {
  const textChannel = require('./core/textChannel');
  textChannel.analyzeScreen(q, {
    onChunk: (chunk) => {
      if (chatWindow && !chatWindow.isDestroyed()) {
        chatWindow.webContents.send('aura:chunk', chunk);
      }
    },
    onClear: () => {
      if (chatWindow && !chatWindow.isDestroyed()) {
        chatWindow.webContents.send('aura:clear');
      }
    },
    onDone: () => {
      if (chatWindow && !chatWindow.isDestroyed()) {
        chatWindow.webContents.send('aura:done');
      }
    },
  });
});

ipcMain.on('aura:start-crop', () => {
  // Screen crop trigger hook
});

// Text Command Dispatcher Bridge
ipcMain.on('aura:typed-input', async (event, text, extra = {}) => {
  console.log(`[AURA Input] Target: [${automationTarget.toUpperCase()}] Mode: [${automationMode}] Command: "${text}"`);
  const textChannel = require('./core/textChannel');

  // Forward response chunks in real-time to the floating chat UI
  textChannel.processText(
    text,
    {
      onChunk: (chunk) => {
        if (chatWindow && !chatWindow.isDestroyed()) {
          chatWindow.webContents.send('aura:chunk', chunk);
        }
      },
      onClear: () => {
        if (chatWindow && !chatWindow.isDestroyed()) {
          chatWindow.webContents.send('aura:clear');
        }
      },
      onDone: () => {
        if (chatWindow && !chatWindow.isDestroyed()) {
          chatWindow.webContents.send('aura:done');
        }
      },
    },
    { ...extra, target: automationTarget, mode: automationMode }
  );
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // Keep app active in tray / background for Ctrl+Space shortcut on Windows
});
