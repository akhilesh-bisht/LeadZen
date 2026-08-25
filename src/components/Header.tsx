import React from "react";
import { Search, Menu, UserCheck, LogIn, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext.js";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onNavigate: (view: "dashboard" | "search" | "leads" | "team") => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onNavigate,
  onToggleMobileSidebar,
}) => {
  const { currentUser, openAuthModal, isAdmin } = useAuth();

  return (
    <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-400 truncate hidden sm:block font-normal">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* User Account / Auth Profile Button */}
        <button
          id="header-user-profile-btn"
          onClick={openAuthModal}
          className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition-all cursor-pointer text-left"
          title="Manage user account / Switch login"
        >
          {currentUser ? (
            <>
              <span
                className="w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs"
                style={{
                  backgroundColor: currentUser.avatarColor || "#6366f1",
                }}
              >
                {currentUser.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="hidden xs:flex flex-col">
                <span className="text-xs font-semibold text-slate-200 leading-none">
                  {currentUser.name}
                </span>
                <span className="text-[9px] font-medium text-slate-400 leading-tight">
                  {isAdmin ? "👑 Admin" : "💼 Sales Rep"}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-200">
                Sign In
              </span>
            </>
          )}
        </button>

        {/* Team quick action */}
        <button
          id="header-team-btn"
          onClick={() => onNavigate("team")}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Team Roster</span>
        </button>

        {/* Quick Search Action */}
        <button
          id="header-prospect-leads-btn"
          onClick={() => onNavigate("search")}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-indigo-200" />
          <span>Prospect</span>
        </button>
      </div>
    </header>
  );
};
