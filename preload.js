// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aura', {
  sendTyped: (text, extra) => ipcRenderer.send('aura:typed-input', text, extra),
  closeChatBox: () => ipcRenderer.send('aura:close-chatbox'),
  minimizeChatBox: () => ipcRenderer.send('aura:minimize-chatbox'),

  // Automation Target Switching (PC ⇄ Mobile)
  setAutomationTarget: (target) => ipcRenderer.send('aura:set-automation-target', target),
  getAutomationTarget: () => ipcRenderer.invoke('aura:get-automation-target'),
  onAutomationTarget: (cb) => {
    const handler = (_, t) => cb(t);
    ipcRenderer.on('aura:automation-target-changed', handler);
    return () => ipcRenderer.removeListener('aura:automation-target-changed', handler);
  },

  // Automation Pipeline Execution Mode (AUTO ⇄ SUPERVISED)
  setAutomationMode: (mode) => ipcRenderer.send('aura:set-automation-mode', mode),
  getAutomationMode: () => ipcRenderer.invoke('aura:get-automation-mode'),
  // Real-time Text Streaming Handlers
  onChunk: (cb) => {
    const handler = (_, chunk) => cb(chunk);
    ipcRenderer.on('aura:chunk', handler);
    return () => ipcRenderer.removeListener('aura:chunk', handler);
  },
  onClear: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('aura:clear', handler);
    return () => ipcRenderer.removeListener('aura:clear', handler);
  },
  onDone: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('aura:done', handler);
    return () => ipcRenderer.removeListener('aura:done', handler);
  },
  onFocusInput: (cb) => {
    const handler = () => cb();
    ipcRenderer.on('aura:focus-input', handler);
    return () => ipcRenderer.removeListener('aura:focus-input', handler);
  },
  // Screen Analysis & Crop Bridges
  analyzeEntireScreen: (q) => ipcRenderer.send('aura:analyze-screen', q),
  startCrop: () => ipcRenderer.send('aura:start-crop')
});
