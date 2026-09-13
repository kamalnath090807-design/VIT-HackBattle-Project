/**
 * AURA Frontend — Human Approval Modal Component
 * Source: docs/04-DESIGN-SYSTEM.md §5.4, docs/11-INTEGRATION-CONTRACT.md §7.2
 */

import React, { useState } from 'react';
import { TaskStep } from '../../types/step';
import {
  AlertTriangle,
  Check,
  X,
  ShieldAlert,
  Code2,
  MessageSquare,
  Mail,
  Smartphone,
  Send,
} from 'lucide-react';

interface ApprovalModalProps {
  step: TaskStep;
  isOpen: boolean;
  onDecision: (decision: 'APPROVED' | 'REJECTED', reason?: string) => Promise<void>;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  step,
  isOpen,
  onDecision,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isMessaging = step.tool === 'send_message';
  const channel = (step.params?.channel || '').toLowerCase();

  const getChannelBadge = () => {
    switch (channel) {
      case 'whatsapp':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold font-mono">
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
          </span>
        );
      case 'email':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold font-mono">
            <Mail className="w-3.5 h-3.5" /> Email
          </span>
        );
      case 'sms':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold font-mono">
            <Smartphone className="w-3.5 h-3.5" /> SMS
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-500/10 text-gray-300 border border-gray-500/20 text-xs font-bold font-mono">
            <Send className="w-3.5 h-3.5" /> {channel || 'Message'}
          </span>
        );
    }
  };

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    try {
      setIsSubmitting(true);
      await onDecision(decision, reason.trim() || undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111827] border-2 border-amber-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-amber-500/10">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Human Approval Mandated
            </h3>
            <p className="text-xs text-amber-400/90 font-mono mt-0.5">
              Deterministic Policy Engine Security Boundary
            </p>
          </div>
        </div>

        {/* Specialized Message Preview Card */}
        {isMessaging ? (
          <div className="bg-[#0A0E17] border border-amber-500/30 rounded-xl p-4 mb-4 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#1F2937]">
              <span className="text-gray-400 font-mono">Recipient:</span>
              <span className="text-white font-bold font-mono text-sm">
                {step.params?.recipientName || 'Verified Contact'}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#1F2937]">
              <span className="text-gray-400 font-mono">Delivery Channel:</span>
              {getChannelBadge()}
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#1F2937]">
              <span className="text-gray-400 font-mono">Destination:</span>
              <span className="text-gray-300 font-mono bg-[#111827] px-2 py-0.5 rounded border border-[#1F2937]">
                {step.params?.destination || 'N/A'}
              </span>
            </div>

            {step.params?.subject && (
              <div className="flex items-center justify-between pb-2 border-b border-[#1F2937]">
                <span className="text-gray-400 font-mono">Subject:</span>
                <span className="text-gray-300 font-mono truncate max-w-[240px]">
                  {step.params.subject}
                </span>
              </div>
            )}

            <div>
              <span className="text-gray-400 font-mono block mb-1">Message Content:</span>
              <div className="p-3 bg-[#111827] rounded-lg border border-[#1F2937] text-gray-200 text-sm italic font-sans">
                "{step.params?.message || ''}"
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-amber-300/80 font-mono bg-amber-500/5 p-2 rounded border border-amber-500/20">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span>External communication will be transmitted to this recipient.</span>
            </div>
          </div>
        ) : (
          <div className="bg-[#0A0E17] border border-[#1F2937] rounded-xl p-4 mb-4 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center pb-2 border-b border-[#1F2937]">
              <span className="text-gray-400">Step Action:</span>
              <span className="text-white font-bold">{step.description}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#1F2937]">
              <span className="text-gray-400">Target Tool:</span>
              <span className="text-blue-400 font-bold">{step.tool}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#1F2937]">
              <span className="text-gray-400">Risk Level:</span>
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> HIGH RISK
              </span>
            </div>

            {step.params && (
              <div>
                <span className="text-gray-400 flex items-center gap-1 mb-1">
                  <Code2 className="w-3 h-3" /> Parameters:
                </span>
                <pre className="p-2 bg-[#111827] rounded text-gray-300 overflow-x-auto text-[11px]">
                  {JSON.stringify(step.params, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="mb-5">
          <label className="block text-xs text-gray-400 font-mono mb-1.5">
            Decision Note (Optional):
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="E.g., Approved after verifying repository parameters"
            disabled={isSubmitting}
            className="w-full bg-[#0A0E17] border border-[#1F2937] rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:border-amber-500 outline-none font-mono"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F2937]">
          <button
            onClick={() => handleDecision('REJECTED')}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Reject Action
          </button>

          <button
            onClick={() => handleDecision('APPROVED')}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            Authorize & Execute
          </button>
        </div>
      </div>
    </div>
  );
};
