// renderer/chat.js
'use strict';

const chatThread = document.getElementById('chat-thread');
const chatInput = document.getElementById('chat-input');
const chatFileInput = document.getElementById('chat-file-input');
const chatFilePreview = document.getElementById('chat-file-preview');
const chatPreviewImg = document.getElementById('chat-preview-img');
const chatPreviewIcon = document.getElementById('chat-preview-icon');
const chatPreviewName = document.getElementById('chat-preview-name');
const btnTargetToggle = document.getElementById('btn-target-toggle');
const targetModeIcon = document.getElementById('target-mode-icon');
const targetModeLabel = document.getElementById('target-mode-label');

let currentAttachment = null;
let currentTargetMode = 'pc';
let activeStreamBubble = null;
let activeStreamText = '';

// Command History Stack (Up / Down arrow recall)
const cmdHistory = [];
let historyIndex = -1;

// ── 1. Target Mode Switcher (PC ⇄ Mobile) ─────────────────────────────────────
async function initTargetMode() {
  if (window.aura) {
    try {
      currentTargetMode = await window.aura.getAutomationTarget();
    } catch (_) {
      currentTargetMode = 'pc';
    }
    updateTargetUI(currentTargetMode);
    window.aura.onAutomationTarget(updateTargetUI);
  }
}

function updateTargetUI(mode) {
  currentTargetMode = mode;
  if (mode === 'mobile') {
    btnTargetToggle.classList.add('mode-mobile');
    targetModeIcon.textContent = '📱';
    targetModeLabel.textContent = 'Mobile';
  } else {
    btnTargetToggle.classList.remove('mode-mobile');
    targetModeIcon.textContent = '💻';
    targetModeLabel.textContent = 'PC';
  }
}

function toggleAutomationTargetMode() {
  const nextMode = currentTargetMode === 'pc' ? 'mobile' : 'pc';
  updateTargetUI(nextMode);
  if (window.aura) window.aura.setAutomationTarget(nextMode);
}

// ── 1b. Pipeline Automation Mode Toggle (AUTO ⇄ SUPERVISED) ──────────────────
let currentAutomationMode = 'AUTO'; // 'AUTO' | 'SUPERVISED'

function toggleAutomationMode() {
  currentAutomationMode = currentAutomationMode === 'AUTO' ? 'SUPERVISED' : 'AUTO';
  updateAutomationModeUI(currentAutomationMode);
  if (window.aura && window.aura.setAutomationMode) {
    window.aura.setAutomationMode(currentAutomationMode);
  }
}

function updateAutomationModeUI(mode) {
  const btn = document.getElementById('btn-pipeline-toggle');
  const label = document.getElementById('pipeline-mode-label');
  if (!btn || !label) return;
  if (mode === 'AUTO') {
    btn.className = 'target-mode-single-btn mode-auto';
    label.textContent = 'AUTO';
    btn.title = 'Execution Pipeline: AUTO (Click to switch to Supervised)';
  } else {
    btn.className = 'target-mode-single-btn mode-supervised';
    label.textContent = 'SUPERVISED';
    btn.title = 'Execution Pipeline: SUPERVISED (Click to switch to Auto)';
  }
}

// ── 2. File Drag & Drop + Clipboard Paste ─────────────────────────────────────
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    stageFile(e.dataTransfer.files[0]);
  }
});

chatInput.addEventListener('paste', (e) => {
  if (e.clipboardData && e.clipboardData.items) {
    for (const item of e.clipboardData.items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          stageFile(file);
          break;
        }
      }
    }
  }
});

function triggerFileUpload() {
  chatFileInput.click();
}

function handleFileSelect(e) {
  if (e.target.files && e.target.files.length > 0) stageFile(e.target.files[0]);
}

function stageFile(file) {
  const reader = new FileReader();
  const isImg = file.type.startsWith('image/');
  reader.onload = (ev) => {
    currentAttachment = {
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl: ev.target.result,
      base64: ev.target.result.split(',')[1],
    };
    chatPreviewName.textContent = file.name;
    if (isImg) {
      chatPreviewImg.src = currentAttachment.dataUrl;
      chatPreviewImg.style.display = 'block';
      chatPreviewIcon.style.display = 'none';
    } else {
      chatPreviewImg.style.display = 'none';
      chatPreviewIcon.style.display = 'inline';
    }
    chatFilePreview.classList.remove('chat-preview-hidden');
    chatInput.focus();
  };
  reader.readAsDataURL(file);
}

function removeFileAttachment() {
  currentAttachment = null;
  chatFileInput.value = '';
  chatFilePreview.classList.add('chat-preview-hidden');
}

// ── 3. Auto-Growing Input & Keyboard Controls ─────────────────────────────────
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
});

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChat();
  } else if (e.key === 'ArrowUp') {
    if (historyIndex < cmdHistory.length - 1) {
      historyIndex++;
      chatInput.value = cmdHistory[cmdHistory.length - 1 - historyIndex];
    }
  } else if (e.key === 'ArrowDown') {
    if (historyIndex > 0) {
      historyIndex--;
      chatInput.value = cmdHistory[cmdHistory.length - 1 - historyIndex];
    } else if (historyIndex === 0) {
      historyIndex = -1;
      chatInput.value = '';
    }
  }
});

// ── 4. Sending Messages ───────────────────────────────────────────────────────
function sendChat() {
  const text = chatInput.value.trim();
  if (!text && !currentAttachment) return;
  cmdHistory.push(text || currentAttachment.name);
  historyIndex = -1;

  // Render User Bubble
  appendUserMessage(text, currentAttachment);

  // Prepare Assistant Streaming Bubble
  createAssistantStreamBubble();

  // Dispatch via IPC
  if (window.aura) {
    window.aura.sendTyped(text, { attachment: currentAttachment });
  }

  // Clear Staged Input
  chatInput.value = '';
  chatInput.style.height = 'auto';
  removeFileAttachment();
}

function appendUserMessage(text, attachment) {
  const row = document.createElement('div');
  row.className = 'chat-msg chat-user';

  let attachHtml = '';
  if (attachment) {
    if (attachment.type.startsWith('image/')) {
      attachHtml = `<img src="${attachment.dataUrl}" style="max-width:180px; max-height:120px; border-radius:6px; margin-bottom:6px; display:block;"/>`;
    } else {
      attachHtml = `<div style="font-size:11px; margin-bottom:4px;">📎 ${escapeHtml(attachment.name)}</div>`;
    }
  }
  row.innerHTML = `<div class="chat-bubble">${attachHtml}${text ? escapeHtml(text) : ''}</div>`;
  chatThread.appendChild(row);
  scrollThread();
}

// ── 5. Markdown, Code & Math Formatting ──────────────────────────────────────
function createAssistantStreamBubble() {
  const row = document.createElement('div');
  row.className = 'chat-msg chat-assistant';
  activeStreamBubble = document.createElement('div');
  activeStreamBubble.className = 'chat-bubble';
  activeStreamBubble.innerHTML = '<span class="chat-typing-cursor"></span>';
  row.appendChild(activeStreamBubble);
  chatThread.appendChild(row);
  activeStreamText = '';
  scrollThread();
}

function renderFormatted(raw) {
  let html = escapeHtml(raw);

  // Fenced Code Blocks with Prism Highlight and Copy Button
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const l = lang || 'javascript';
    return `
      <div class="code-block">
        <div class="code-header">
          <span>${l.toUpperCase()}</span>
          <button class="code-copy-btn" onclick="navigator.clipboard.writeText(decodeURIComponent('${encodeURIComponent(code)}'))">Copy</button>
        </div>
        <pre class="code-content"><code class="language-${l}">${code}</code></pre>
      </div>`;
  });

  // Headers
  html = html.replace(/^### (.*$)/gim, '<div class="chat-h3">$1</div>');
  html = html.replace(/^## (.*$)/gim, '<div class="chat-h2">$1</div>');
  html = html.replace(/^# (.*$)/gim, '<div class="chat-h1">$1</div>');

  // Point-wise list items
  html = html.replace(/^[\*\-] (.*$)/gim, '<div class="chat-bullet-item"><span class="chat-bullet-dot">▸</span><span>$1</span></div>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(0,240,255,0.1); padding:2px 5px; border-radius:4px; font-family:\'JetBrains Mono\', monospace; color:#00f0ff;">$1</code>');

  return html;
}

// ── 6. IPC Real-Time Stream Listeners ─────────────────────────────────────────
if (window.aura) {
  window.aura.onChunk((chunk) => {
    activeStreamText += chunk;
    if (activeStreamBubble) {
      activeStreamBubble.innerHTML = renderFormatted(activeStreamText) + '<span class="chat-typing-cursor"></span>';
      scrollThread();
    }
  });

  window.aura.onClear(() => {
    activeStreamText = '';
    if (activeStreamBubble) activeStreamBubble.innerHTML = '<span class="chat-typing-cursor"></span>';
  });

  window.aura.onDone(() => {
    if (activeStreamBubble) {
      activeStreamBubble.innerHTML = renderFormatted(activeStreamText);
      // Re-trigger syntax highlighting on newly injected code blocks
      if (window.Prism) window.Prism.highlightAllUnder(activeStreamBubble);
      // Re-render KaTeX math if present
      if (window.renderMathInElement) {
        window.renderMathInElement(activeStreamBubble, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
          ],
        });
      }
    }
  });

  window.aura.onFocusInput(() => {
    chatInput.focus();
  });
}

function escapeHtml(t) {
  return (t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function scrollThread() {
  chatThread.scrollTop = chatThread.scrollHeight;
}

function getTimeOfDayGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) {
    return {
      title: 'Good Morning! ☀️ 🌅',
      subtitle: 'Fresh start today! What would you like to build or automate?',
      icon: '🌅',
      badge: 'MORNING ENERGY ☀️',
      gradient: 'linear-gradient(135deg, rgba(255, 180, 0, 0.15), rgba(255, 100, 0, 0.04))',
      border: 'rgba(255, 180, 0, 0.35)',
      color: '#FFB800',
    };
  } else if (h >= 12 && h < 17) {
    return {
      title: 'Good Afternoon! ☀️ ⚡',
      subtitle: 'High productivity hours! How can I assist your workflow today?',
      icon: '☀️',
      badge: 'PEAK FOCUS ⚡',
      gradient: 'linear-gradient(135deg, rgba(79, 216, 255, 0.15), rgba(0, 180, 255, 0.04))',
      border: 'rgba(79, 216, 255, 0.35)',
      color: '#4FD8FF',
    };
  } else if (h >= 17 && h < 23) {
    return {
      title: 'Good Evening! 🌙 ✨',
      subtitle: 'Unwind or code into the evening! I am ready when you are.',
      icon: '🌙',
      badge: 'EVENING VIBES 🌙',
      gradient: 'linear-gradient(135deg, rgba(192, 38, 211, 0.15), rgba(120, 20, 180, 0.04))',
      border: 'rgba(192, 38, 211, 0.35)',
      color: '#E879F9',
    };
  } else {
    // Exact Midnight Card from Screenshot (23:00 - 05:00)
    return {
      title: 'Late Night Coding? 🌌 🚀',
      subtitle: 'Midnight focus mode active! CodeNight engine ready for deep work.',
      icon: '🌌',
      badge: 'MIDNIGHT MODE 🌌',
      gradient: 'linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(0, 150, 70, 0.04))',
      border: 'rgba(0, 255, 136, 0.35)',
      color: '#00FF88',
    };
  }
}

function renderWelcomeCard() {
  if (!chatThread) return;
  chatThread.innerHTML = '';
  const info = getTimeOfDayGreeting();
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const card = document.createElement('div');
  card.className = 'chat-welcome-card';
  card.style.background = info.gradient;
  card.style.borderColor = info.border;
  card.innerHTML = `
    <div class="chat-welcome-header">
      <span class="chat-welcome-badge" style="color:${info.color}; border-color:${info.border};">${info.badge}</span>
      <div class="chat-welcome-header-right">
        <button id="welcome-history-btn" class="welcome-history-btn" onclick="toggleChatHistoryUI()" title="View Stored History">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
          <span>History</span>
        </button>
        <span class="chat-welcome-time">${timeStr}</span>
      </div>
    </div>
    <div class="chat-welcome-body">
      <div class="chat-welcome-icon">${info.icon}</div>
      <div class="chat-welcome-text">
        <h3 class="chat-welcome-title">${info.title}</h3>
        <p class="chat-welcome-sub">${info.subtitle}</p>
      </div>
    </div>
    <div class="chat-quick-chips">
      <div class="chat-chip" onclick="quickSend('open vs code')" title="Launch Visual Studio Code">💻 Open VS Code</div>
      <div class="chat-chip" onclick="quickSend('close all apps')" title="Close third-party applications safely">🛑 Close All Apps</div>
      <div class="chat-chip" onclick="quickSend('code terminate')" title="Automate system shutdown in 5s">⚠️ Code Terminate</div>
      <div class="chat-chip" onclick="quickSend('play trending songs in tamil')" title="Search and play trending songs in Tamil on YouTube">🎵 Trending Songs</div>
    </div>
  `;
  chatThread.appendChild(card);
}

function quickSend(text) {
  if (chatInput) {
    chatInput.value = text;
    sendChat();
  }
}

function toggleChatHistoryUI() {
  if (cmdHistory.length === 0) {
    appendUserMessage('No prior commands in session history yet.', null);
    return;
  }
  const summary = `**Session Command History (${cmdHistory.length}):**\n` + cmdHistory.map((c, i) => `${i + 1}. \`${c}\``).join('\n');
  createAssistantStreamBubble();
  activeStreamBubble.innerHTML = renderFormatted(summary);
  scrollThread();
}

function clearThread() {
  renderWelcomeCard();
}

function closeWindow() {
  if (window.aura) window.aura.closeChatBox();
}

function minimizeWindow() {
  if (window.aura) window.aura.minimizeChatBox();
}

function triggerScreenAnalysis() {
  if (window.aura) window.aura.analyzeEntireScreen(chatInput.value.trim());
}

initTargetMode();
renderWelcomeCard();
