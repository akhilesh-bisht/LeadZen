import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, HardDrive, X, Copy, Check } from 'lucide-react';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ isOpen, onClose }) => {
  const [dbStatus, setDbStatus] = useState<{
    mode: 'mongodb' | 'local_persistent';
    isConnected: boolean;
    hasMongoUri: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/db-status')
        .then((res) => res.json())
        .then((data) => setDbStatus(data))
        .catch(() => setDbStatus(null));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const mongoExample = 'MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/leadgen?retryWrites=true&w=majority"';

  const handleCopy = () => {
    navigator.clipboard.writeText(mongoExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-zinc-900">Database Storage Configuration</h3>
              <p className="text-xs text-zinc-500">MongoDB Mongoose & Persistent Storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-xl hover:bg-zinc-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Active Mode Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              dbStatus?.mode === 'mongodb' && dbStatus?.isConnected
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-zinc-100/90 border-zinc-200/90 text-zinc-900'
            }`}
          >
            {dbStatus?.mode === 'mongodb' && dbStatus?.isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <HardDrive className="w-5 h-5 text-zinc-700 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-0.5">Active Storage</div>
              <div className="text-sm font-extrabold text-zinc-900">
                {dbStatus?.mode === 'mongodb' && dbStatus?.isConnected
                  ? 'Connected to MongoDB Atlas'
                  : 'Local Persistent Store (.data/leads.json)'}
              </div>
              <p className="text-xs mt-1 leading-relaxed text-zinc-600">
                {dbStatus?.mode === 'mongodb' && dbStatus?.isConnected
                  ? 'All lead records, queries, aggregations, and updates are actively persisted to your MongoDB cluster.'
                  : 'All lead operations, duplicate detection, filters, notes, and CRM status updates are persisted across server restarts. You can connect a live MongoDB cluster anytime!'}
              </p>
            </div>
          </div>

          {/* Setup MongoDB Atlas Steps */}
          <div>
            <h4 className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider mb-2">
              Connecting MongoDB Atlas (Optional)
            </h4>
            <div className="text-xs text-zinc-600 space-y-2">
              <p>
                1. Create a free MongoDB cluster at{' '}
                <a
                  href="https://www.mongodb.com/cloud/atlas"
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-900 underline font-bold"
                >
                  mongodb.com/atlas
                </a>
                .
              </p>
              <p>2. Copy your connection string into your project environment variables:</p>
            </div>

            <div className="mt-2 relative">
              <pre className="p-3.5 bg-zinc-900 text-zinc-200 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all pr-10 border border-zinc-800">
                {mongoExample}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2.5 right-2.5 p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Copy configuration snippet"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/80 text-xs text-zinc-600">
            <span className="font-bold text-zinc-900">Zero Static Data Policy:</span> Every lead saved in
            the system is 100% dynamic from live business providers (OpenStreetMap Overpass / Google Places API /
            Search Grounding) and stored in the database.
          </div>
        </div>

        <div className="px-6 py-4 bg-zinc-50/80 border-t border-zinc-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
