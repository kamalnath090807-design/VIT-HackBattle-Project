/**
 * AURA Frontend — Top Navigation Bar
 * Source: docs/04-DESIGN-SYSTEM.md §4.2
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Cpu, LayoutDashboard, History, Wrench, LogOut, LogIn, User as UserIcon } from 'lucide-react';

export const NavBar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/history', label: 'Task History', icon: History },
    { to: '/tools', label: 'Tools', icon: Wrench },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0A0E17]/80 backdrop-blur-md border-b border-[#1F2937]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-wider text-white flex items-center gap-1.5">
              AURA
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </span>
            <span className="text-[10px] text-gray-400 font-mono tracking-tight uppercase">
              Autonomous Reasoning Agent
            </span>
          </div>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1F2937]/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Auth controls */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-300 bg-[#111827] px-3 py-1.5 rounded-lg border border-[#1F2937]">
                <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-mono text-gray-200 truncate max-w-[150px]">
                  {user?.email}
                </span>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
