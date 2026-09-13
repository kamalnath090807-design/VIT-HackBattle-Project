/**
 * AURA Frontend — Authentication Page
 *
 * Implements Supabase user login/registration and demo quick-login.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu, LogIn, UserPlus, Sparkles, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, demoLogin } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError(null);
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    demoLogin();
    navigate('/');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111827] border border-[#1F2937] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isRegister ? 'Register AURA Account' : 'Sign in to AURA'}
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Autonomous Unified Reasoning Agent Operations Console
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/30 border border-red-800/50 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1.5 uppercase">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="operator@aura.ai"
              className="w-full bg-[#0A0E17] border border-[#1F2937] focus:border-blue-500 rounded-xl p-3 text-sm text-white placeholder-gray-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1.5 uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-[#0A0E17] border border-[#1F2937] focus:border-blue-500 rounded-xl p-3 text-sm text-white placeholder-gray-500 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
          >
            {isRegister ? (
              <>
                <UserPlus className="w-4 h-4" />
                {loading ? 'Creating account...' : 'Create Account'}
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                {loading ? 'Authenticating...' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#1F2937]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#111827] px-2 text-gray-500 font-mono">Or demo mode</span>
          </div>
        </div>

        {/* Demo Quick Login */}
        <button
          onClick={handleDemoLogin}
          className="w-full py-2.5 bg-[#1F2937]/60 hover:bg-[#1F2937] border border-[#1F2937] text-gray-200 hover:text-white rounded-xl text-xs font-mono font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Judge / Quick Demo Sign In
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-blue-400 hover:underline font-mono"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};
