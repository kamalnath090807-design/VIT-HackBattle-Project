import React from 'react';
import { NavBar } from './NavBar';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0E17] text-[#F9FAFB]">
      <NavBar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-[#1F2937] py-6 text-center text-xs text-gray-500 font-mono">
        AURA (Autonomous Unified Reasoning Agent) &bull; VIT HackBattle 2026 &bull; Bounded Autonomous Workflows
      </footer>
    </div>
  );
};
