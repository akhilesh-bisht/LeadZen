import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  subtitle?: string;
  color?: 'slate' | 'sky' | 'amber' | 'emerald' | 'rose' | 'indigo';
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  color = 'slate',
  onClick,
}) => {
  const iconColorMap = {
    slate: 'text-slate-300 bg-slate-800/80 border-slate-700/80',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  };

  const topAccentMap = {
    slate: 'bg-slate-500',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    indigo: 'bg-indigo-500',
  };

  return (
    <div
      onClick={onClick}
      className={`relative p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm transition-all overflow-hidden group ${
        onClick ? 'cursor-pointer hover:border-slate-700 hover:bg-slate-850 hover:shadow-md' : ''
      }`}
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${topAccentMap[color]} opacity-80`} />
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${iconColorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      
      <div>
        <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
          {value}
        </div>
        {subtitle && <p className="text-[11px] text-slate-400 mt-1 font-medium truncate">{subtitle}</p>}
      </div>
    </div>
  );
};
