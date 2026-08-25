import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Request Failed',
  message,
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-rose-50/70 rounded-2xl border border-rose-200/90 shadow-xs">
      <div className="w-12 h-12 rounded-2xl bg-rose-100/90 flex items-center justify-center text-rose-600 mb-3 border border-rose-200">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h3 className="text-base font-extrabold text-rose-950">{title}</h3>
      <p className="text-xs text-rose-700 mt-1 max-w-md leading-relaxed">{message}</p>

      {onRetry && (
        <button
          id="error-state-retry-btn"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};
