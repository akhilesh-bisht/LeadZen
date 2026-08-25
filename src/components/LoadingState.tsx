import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  subMessage,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-zinc-200/90 shadow-xs">
      <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4 border border-zinc-200">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-800" />
      </div>
      <h3 className="text-base font-extrabold text-zinc-900">{message}</h3>
      {subMessage && <p className="text-xs text-zinc-500 mt-1 max-w-sm">{subMessage}</p>}
    </div>
  );
};
