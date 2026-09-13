import React from 'react';
import { Monitor, Smartphone, Zap, Sparkles } from 'lucide-react';

export type AutomationMode = 'unified' | 'pc' | 'mobile';

interface AutomationModeSelectorProps {
  currentMode: AutomationMode;
  onModeChange: (mode: AutomationMode) => void;
  onSelectPrompt: (prompt: string) => void;
}

export const AutomationModeSelector: React.FC<AutomationModeSelectorProps> = ({
  currentMode,
  onModeChange,
  onSelectPrompt,
}) => {
  const promptSuggestions: Record<AutomationMode, string[]> = {
    unified: [
      "Send Abishek 'HackBattle demo is ready!' on WhatsApp and email",
      "Check phone battery, unlock phone, and launch VS Code on PC",
      "Take a selfie on phone and save note 'Project status verified' on PC",
      "Log expense 250 for lunch and generate daily briefing",
    ],
    pc: [
      "Launch VS Code and type 'console.log(\"AURA Autonomous Agent Active\");'",
      "Retrieve live system telemetry and check available disk space",
      "Solve the active MCQ on screen with snippet grounding and click next",
      "Restore focus to active editor and paste clipboard text",
    ],
    mobile: [
      "Wake phone screen, enter PIN 1234, and open WhatsApp",
      "Search 'lo-fi beats for coding' on YouTube and play the 1st video",
      "Send WhatsApp image from /sdcard/Download/test.png to Abishek with caption 'Architecture diagram'",
      "Set native Android alarm for 7:00 AM labeled 'VIT HackBattle Submission'",
    ],
  };

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Automation Domain Modes
        </span>

        {/* Mode Pills */}
        <div className="inline-flex rounded-lg bg-[#0B0F17] p-1 border border-[#1F2937]">
          <button
            onClick={() => onModeChange('unified')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
              currentMode === 'unified'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Unified
          </button>

          <button
            onClick={() => onModeChange('pc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
              currentMode === 'pc'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            PC Native
          </button>

          <button
            onClick={() => onModeChange('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
              currentMode === 'mobile'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Android ADB
          </button>
        </div>
      </div>

      {/* Suggested Quick Action Chips */}
      <div className="flex flex-wrap gap-2 mt-2">
        {promptSuggestions[currentMode].map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(prompt)}
            className="text-left text-xs bg-[#1F2937]/50 hover:bg-[#1F2937] text-gray-300 hover:text-white px-3 py-1.5 rounded-lg border border-[#374151]/50 hover:border-indigo-500/50 transition-all font-mono group flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 group-hover:scale-125 transition-transform" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
