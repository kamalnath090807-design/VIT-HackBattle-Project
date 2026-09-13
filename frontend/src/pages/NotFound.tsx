import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <HelpCircle className="w-16 h-16 text-blue-500/40 mb-4" />
      <h1 className="text-3xl font-bold text-white mb-2">404 — Page Not Found</h1>
      <p className="text-sm text-gray-400 max-w-sm mb-6">
        The telemetry endpoint or route you requested does not exist in the operations dashboard.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold tracking-wide transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
};
