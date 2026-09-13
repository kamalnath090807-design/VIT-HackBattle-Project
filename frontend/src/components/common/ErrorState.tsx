import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An error occurred',
  message,
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-950/20 border border-red-900/40 rounded-xl text-center max-w-md mx-auto my-6">
      <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
      <h3 className="text-base font-semibold text-red-200">{title}</h3>
      <p className="text-sm text-red-300/80 mt-1 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 rounded-lg text-xs font-semibold text-red-100 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
};
