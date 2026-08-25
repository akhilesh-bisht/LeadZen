import React from 'react';
import { SearchX, FolderOpen, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: 'search' | 'folder';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon = 'folder',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-zinc-200/90 shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 mb-4 border border-zinc-200">
        {icon === 'search' ? (
          <SearchX className="w-6 h-6 text-zinc-500" />
        ) : (
          <FolderOpen className="w-6 h-6 text-zinc-500" />
        )}
      </div>
      <h3 className="text-base font-extrabold text-zinc-900">{title}</h3>
      <p className="text-xs text-zinc-500 mt-1.5 max-w-md leading-relaxed">{description}</p>

      {actionLabel && onAction && (
        <button
          id="empty-state-action-btn"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
