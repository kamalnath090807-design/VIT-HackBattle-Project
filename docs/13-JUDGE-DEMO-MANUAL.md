# AURA — Hackathon Judge Demo Manual & Technical Defense Guide

**Event**: VIT HackBattle 2026 (36-Hour Hackathon)  
**Track**: AI & Automation  
**Primary Subtrack**: Agentic Workflows  
**Team**: Kamal (Architecture) · Manoj (Frontend/UI) · Abishek (Backend/Execution) · Bala Subramanian V (AI/LLM) · Elango (Testing/QA)  

---

## 1. The 30-Second Elevator Pitch

> *"Most modern AI is trapped inside a chat window — typing text and apologizing.  
> We built **AURA (Autonomous Unified Reasoning Agent)** to answer the hackathon challenge directly:  
> We gave AI **real hands** across Windows PC and physical Android phones, **persistent memory**, and a **deterministic sense of boundaries** so it can act autonomously without dangerous runaway behavior."*

---

## 2. Direct Alignment with Hackathon Problem Statement

| Problem Statement Directive | How AURA Delivers (The Implementation) |
|---|---|
| **"Rescue AI from the chat window"** | Floating Cyberpunk Desktop HUD (Electron) that overlays any app, paired with physical device control. Not a chatbox — a unified command center. |
| **"Give it Hands"** | **Dual-Target Real OS Execution**: Controls real Windows 11 OS (UWP Store apps, Win32 apps, system metrics, audio, files) AND real physical Android smartphones over Wireless ADB (PIN unlock, camera, games, WhatsApp, screen recording). |
| **"Give it Memory"** | Persistent LRU Long-Term & Short-Term Memory Engine (`memoryEngine.js`) remembering user preferences, device pairing tokens, and custom aliases across restarts. |
| **"A Sense of Boundaries"** | **Deterministic Policy Engine** (`policyEngine.js`): Hard-coded security tiers (LOW, MEDIUM, HIGH, CRITICAL). The LLM is **never** the sole authority on permissions. Critical/destructive actions pause execution and require explicit Human-in-the-Loop approval. |
| **"Without Constant Supervision"** | Autonomous ReAct Multi-Step Decomposition (`planner.js`), Outcome Verification (`verifier.js`), and Dynamic Error Replanning (`replanner.js`). |

---

## 3. What Makes AURA Unique? (The "X-Factor" vs Other Teams)

1. **True Cross-Device Physical Execution (PC + Mobile Phone over Wireless ADB)**:
   - Other agents just mock actions or call toy REST APIs in a sandbox.
   - AURA controls a **live physical smartphone over Wi-Fi without cables** (wakes the phone, swipes up, enters lockscreen PIN `090807`, launches games like Free Fire, takes selfies via Android camera intent, or sends WhatsApp messages).
2. **Deep OS App Resolution (Win32 + Modern Windows Store / UWP)**:
   - Built with a PowerShell `Get-StartApps` indexer. It understands both legacy `.exe` binaries and modern sandboxed MSIX/UWP apps (like WhatsApp Desktop `5319275A.WhatsAppDesktop_cv1g1gvanyjgm!App` and protocol handlers `whatsapp:`).
   - Distinguishes between **applications** and **files/folders** with strict stem-matching so typing `open whatsapp` launches the app instead of opening random image files in VS Code.
3. **Deterministic Human-in-the-Loop Guardrails (Zero Hallucinated Permissions)**:
   - When an action is High Risk (e.g., dialing a phone call, sending an external WhatsApp message, terminating a critical process, executing a PC shutdown), AURA **freezes the execution pipeline** and renders a live approval modal on the HUD.
4. **Intelligent Multitasking Engine & Greedy Lookahead Tokenizer**:
   - Other voice/text assistants fail on multi-app requests due to the **Missing Connector Problem** (e.g. *"open whatsapp youtube calculator vs code and edge"* treated as one nonexistent app) or the **Compound Command Collision** (breaking *"open WhatsApp and search for Kamal"* into two fragmented parts).
   - AURA features a **4-Stage Multitasking Pipeline**:
     - *Stage 1 (Atomic Intent Filter)*: Preserves compound actions with action/search verbs.
     - *Stage 2 (Greedy Multi-Open Splitter)*: Uses a length-descending vocabulary with 2-word lookahead to capture multi-word apps (`vs code`, `file explorer`) without connectors.
     - *Stage 3 (Fast-Path Batch Executor)*: Suppresses per-app voice chatter and staggers launches by 150ms to prevent Windows focus collisions.
     - *Stage 4 (Unified Human Confirmation)*: Formats natural English summaries (`"Opened WhatsApp, YouTube, Calculator, VS Code, and Edge."`).
5. **Workspace Setups Engine (One-Command Developer Environments)**:
   - Command `open setup 1` (or `"dev setup"`) launches **Chrome, WhatsApp, VS Code, and File Explorer** with a 700ms smooth sequence.
   - Command `open setup 2` (or `"work setup"`, `"ai setup"`) launches **AntiGravity, File Explorer, ChatGPT, Outlook, and LinkedIn**.
6. **Zero-Downtime Offline Hybrid Architecture (Hackathon Demo Proof)**:
   - If the venue Wi-Fi drops or Groq/Gemini API rate-limits, AURA's offline heuristic engine immediately takes over. **The demo will never crash or hang on stage**.
7. **Full Tamper-Evident Audit Logging**:
   - Every single plan, risk assessment, tool execution, and verification receipt is logged to Supabase and local JSONL.

---

## 4. System Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AURA FLOATING HUD (UI)                          │
│     Electron 29 · Framer Motion · Glassmorphism · Real-time IPC        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       AURA AGENT CORE ENGINE                           │
│  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ Dual-Tier LLM Planner │  │ Intent Engine   │  │ Memory Engine    │  │
│  │ (Groq LLaMA / Gemini) │  │ (Semantic Router│  │ (LRU + Context)  │  │
│  └───────────┬───────────┘  └────────┬────────┘  └──────────────────┘  │
│              │                       │                                 │
│              ▼                       ▼                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │     DETERMINISTIC POLICY ENGINE (Strict Security Guardrails)     │  │
│  │   [LOW: Auto]   [MEDIUM: Logged]   [HIGH: Human Approval]        │  │
│  │                     [CRITICAL: Hard Blocked]                     │  │
│  └───────────────────────────────────┬──────────────────────────────┘  │
│                                      │                                 │
│                                      ▼                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │               TOOL ROUTER & STEP VERIFICATION ENGINE             │  │
│  └───────────────────────┬───────────────────────────┬──────────────┘  │
└──────────────────────────┼───────────────────────────┼─────────────────┘
                           │                           │
              ┌────────────▼─────────┐   ┌─────────────▼────────────┐
              │ WINDOWS PC ENGINE    │   │ ANDROID MOBILE ENGINE    │
              │ • PowerShell App     │   │ • Wireless ADB (TCP/IP)  │
              │   Indexer (UWP/Win32)│   │ • Keyevent Hardware      │
              │ • Windows Audio/Disp │   │   Emulation (Wake/PIN)   │
              │ • Native Key Jitter  │   │ • Android Intent Router  │
              │ • WMI Telemetry      │   │ • MediaScanner & Record  │
              └──────────────────────┘   └──────────────────────────┘
```

### Detailed Stack Breakdown:
- **Frontend / HUD**: Electron 29, TailwindCSS, Glassmorphic Cyberpunk theme, IPC EventEmitter streams.
- **Backend & Automation**: Node.js v20, Express, Child Processes, PowerShell Host, WMI / Win32 API.
- **Mobile Bridge**: Android Debug Bridge (ADB), TLS 1.3 Pairing, TCP/IP 5555, mDNS service discovery.
- **AI & Reasoning**: Multi-Provider Adapter (Groq LLaMA-3.3-70B-Versatile + Google Gemini 1.5 Flash), ReAct Prompt Harness, Heuristic Offline Planner.
- **Data & Safety**: Supabase (PostgreSQL), Audit Logger, Memory Engine.

---

## 5. The 3-Minute Winning Live Demo Script

Follow this exact sequence when presenting to the judges:

### Phase 1: The Hook & Intro (0:00 – 0:40)
- **Speaker**: *"Judges, every AI demo you will see today is an AI talking to you. AURA is an AI that **works for you**. Notice our HUD floating over the screen. It is connected to my PC and wirelessly to this real Android phone in my hand."*
- **Show**: Point out the target switch on the HUD (`PC` vs `MOBILE`).

### Phase 2: Autonomous PC Control & Intelligence (0:40 – 1:20)
- **Command 1**: `open whatsapp` (in PC mode)
  - **What Happens**: AURA recognizes WhatsApp as a desktop application (not a random JPEG in Downloads!), searches the Windows StartApps registry, and opens WhatsApp Desktop instantly.
  - **Say to Judges**: *"Notice it didn't just blindly search the filesystem for files containing 'whatsapp'. It intelligently resolved the OS application signature."*
- **Command 2**: `what is my system health?`
  - **What Happens**: AURA queries WMI and returns real-time CPU load %, RAM usage, and battery state.
- **Command 3**: `turn on night light` or `set volume to 40`
  - **What Happens**: Windows system settings change live before their eyes.

### Phase 3: The Showstopper — Wireless Mobile Phone Control (1:20 – 2:10)
- **Speaker**: *"Now watch what happens when we switch to mobile mode over Wi-Fi. My phone is locked on the table with a PIN."*
- **Command 4**: `unlock the phone`
  - **What Happens**: Phone screen wakes up, swipes the keyguard, enters PIN `090807`, and unlocks to the home screen.
- **Command 5**: `take a selfie`
  - **What Happens**: Phone launches the front camera and snaps a photo via native Android intent.
- **Command 6**: `open free fire` or `open youtube`
  - **What Happens**: Phone immediately launches the requested game or app via dynamic package resolution.

### Phase 4: The Boundary & Trust Pillar — Human-in-the-Loop Security (2:10 – 2:45)
- **Speaker**: *"The problem statement demanded a 'sense of boundaries'. What stops an autonomous agent from doing something dangerous? Watch this."*
- **Command 7**: `send whatsapp message to Abishek saying HackBattle demo is ready`
  - **What Happens**: AURA identifies this as a **HIGH RISK** mutation. It **pauses execution**, sounds an alert, and presents a **Human Approval Modal** detailing the recipient, message, and risk level.
  - **Say to Judges**: *"Deterministic guardrails. The LLM is NEVER the sole authority on executing high-risk real-world actions. The human stays in control."*
- Click **Approve**, and the message sends!

### Phase 5: Conclusion (2:45 – 3:00)
- **Speaker**: *"AURA has hands, memory, and boundaries. It is fully tested with 80+ automated unit tests and works online or offline. Thank you!"*

---

## 6. Complete Command Cheat-Sheet (Live Demo Ready)

### 💻 PC Automation Commands
| What to Type | What It Does |
|---|---|
| `open whatsapp` | Launches Windows WhatsApp Desktop app |
| `open chrome` | Launches Google Chrome |
| `open vscode` | Launches Visual Studio Code |
| `open notepad` | Launches Windows Notepad |
| `open file package.json` | Finds and opens `package.json` in VS Code |
| `what is my system health?` | Displays live CPU %, RAM %, and battery metrics |
| `set volume to 50` | Sets PC master audio volume to 50% |
| `volume up` / `volume down` | Ticks volume up or down |
| `mute volume` / `unmute volume` | Mutes or unmutes PC audio |
| `set brightness to 80` | Adjusts monitor brightness to 80% |
| `turn on night light` | Toggles Windows 11 Night Light |
| `switch to dark mode` | Toggles Windows 11 dark theme |
| `lock pc` | Locks the Windows workstation session |
| `play believer on youtube` | Searches YouTube and opens video playback |

### 🚀 Multitasking & Workspace Setups (The Friday Engine)
| What to Type | What It Does |
|---|---|
| `open whatsapp youtube calculator vs code and edge` | **Greedy 2-word lookahead tokenizer** launches all 5 apps with 150ms stagger & unified voice/text confirmation |
| `open chrome, whatsapp, vscode, file explorer` | Delimiter-based batch launch with unified confirmation |
| `open edge and calculator and youtube` | Chained connector batch launch |
| `open setup 1` (or `"dev setup"`) | Launches **Dev & Communication Setup** (Chrome, WhatsApp, VS Code, File Explorer) with 700ms stagger |
| `open setup 2` (or `"work setup"`, `"ai setup"`) | Launches **Work & AI Setup** (AntiGravity, File Explorer, ChatGPT, Outlook, LinkedIn) with 700ms stagger |


### 📱 Mobile Phone Commands (Vivo V2404i / Android ADB)
| What to Type | What It Does |
|---|---|
| `unlock` / `unlock phone` | Wakes phone, bypasses keyguard, inputs PIN `090807` |
| `lock` / `lock phone` | Puts phone to sleep immediately |
| `check phone battery` | Displays Android battery percentage, temp & status |
| `take a selfie` | Opens front camera and snaps a photo |
| `open camera` | Opens rear camera |
| `take a screenshot` | Captures Android screen and transfers it to PC |
| `open free fire` | Dynamically launches Free Fire game |
| `open whatsapp` | Opens WhatsApp app on phone |
| `open youtube` | Opens YouTube on phone |
| `open spotify` | Opens Spotify on phone |
| `start screen recording` | Starts native background screen recording on phone |
| `stop screen recording` | Stops recording and auto-pulls `.mp4` to PC Downloads |
| `play believer on phone` | Searches and plays song on Android YouTube |

### 🛡️ Guardrails & Multi-Step Workflows
| What to Type | What It Demonstrates |
|---|---|
| `send whatsapp to Abishek saying hello` | Triggers **HIGH RISK** Human Approval Modal |
| `close process chrome.exe` | Triggers **HIGH RISK** Process Termination Gate |
| `schedule meeting with team tomorrow at 10 AM` | Multi-step calendar resolution + approval |
| `find recent github issues on owner/repo` | Public API integration |

---

## 7. Judge Q&A & Technical Defense

### Q1: "How is AURA different from AutoGPT or generic LangChain/CrewAI agents?"
> **Answer**:  
> *"Generic agent frameworks operate primarily in simulated sandboxes or make mock HTTP calls. AURA is engineered for **physical, multi-device OS execution**:  
> 1. It integrates directly with the **Windows Subsystem and PowerShell** to run native Win32 and Modern UWP apps.  
> 2. It controls a **live Android smartphone over Wireless ADB TCP/IP** via hardware keyevents, Android Intent broadcasting, and package manager introspection.  
> 3. Unlike generic agents that let the LLM hallucinate tool execution, AURA uses a **deterministic policy engine** where permission decisions are governed by code, not LLM temperature."*

### Q2: "What prevents the agent from deleting files or doing something malicious?"
> **Answer**:  
> *"We enforce our core design principle: **Deterministic > Probabilistic**. The LLM is used strictly for reasoning and semantic decomposition. Every action must be cataloged in `toolRegistry.js` with a deterministic risk tier (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).  
> Any tool with `requiresApproval: true` or `HIGH`/`CRITICAL` risk is halted by the backend orchestrator until an explicit cryptographically-tagged approval token is received from the human user. Furthermore, kernel processes and critical files are protected by a hard-coded safety blacklist."*

### Q3: "How does the mobile connection work? Does it need an app installed on the phone?"
> **Answer**:  
> *"No companion app or rooting required! It communicates via Android's native **Wireless Debugging over TLS / TCP/IP (port 5555 / mDNS)**. The agent issues low-level shell commands, keyevents (e.g. `input keyevent 224` for screen wake), Activity Manager intents (`am start -a android.media.action.STILL_IMAGE_CAMERA`), and Package Manager queries (`pm list packages`). This makes AURA compatible with virtually any modern Android device out of the box."*

### Q4: "What happens if the venue Wi-Fi is terrible or the LLM API is rate-limited?"
> **Answer**:  
> *"We built AURA with a **Dual-Tier Resilient Provider Architecture**. Primary planning routes through high-speed Groq LLaMA-3.3-70B, with automated failover to Google Gemini 1.5 Flash. If both external APIs are unreachable or offline, AURA's **Deterministic Offline Heuristic Planner** takes over immediately. The user commands will execute flawlessly regardless of network conditions."*

### Q5: "How does AURA distinguish between launching an app and opening a file?"
> **Answer**:  
> *"AURA uses a dual-index architecture:  
> 1. The **System Indexer** scans Windows `Get-StartApps` registry, resolving UWP app IDs (like `5319275A.WhatsAppDesktop`) and Win32 executable links.  
> 2. The **File Indexer** uses strict basename and stem-matching. Unless an explicit file extension (`.txt`, `.jpeg`), path separator, or folder keyword is detected, natural language commands like 'open whatsapp' route to `pc_launch_app` rather than fuzzy matching random files in Downloads."*
