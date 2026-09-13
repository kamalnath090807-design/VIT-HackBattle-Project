import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[#1F2937] rounded-xl bg-[#111827]/40 my-6">
      <div className="w-12 h-12 rounded-full bg-[#1F2937] flex items-center justify-center text-gray-400 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-medium text-gray-200">{title}</h3>
      <p className="text-sm text-gray-400 max-w-sm mt-1 mb-5">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold tracking-wide transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
