import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Search,
  Users,
  Radio,
  UserCheck,
  ChevronRight,
  LogOut,
  Key,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.js";

interface SidebarProps {
  currentView: "dashboard" | "search" | "leads" | "lead-details" | "team";
  onNavigate: (view: "dashboard" | "search" | "leads" | "team") => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
}) => {
  const { currentUser, isAdmin, canAccess, logout, openAuthModal } = useAuth();
  const [unassignedCount, setUnassignedCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((stats) => {
        if (stats && typeof stats.unassignedCount === "number") {
          setUnassignedCount(stats.unassignedCount);
        }
      })
      .catch(() => null);
  }, [currentView]);

  const navItems = [
    {
      id: "dashboard",
      label: "Overview",
      icon: LayoutDashboard,
      view: "dashboard" as const,
      badge: "Live",
      badgeColor:
        "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
      permission: "overview" as const,
    },
    {
      id: "search",
      label: "Prospect Leads",
      icon: Search,
      view: "search" as const,
      badge: "Live",
      badgeColor:
        "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
      permission: "search" as const,
    },
    {
      id: "leads",
      label: "Saved Leads",
      icon: Users,
      view: "leads" as const,
      badge: null,
      permission: "leads" as const,
    },
    {
      id: "team",
      label: "Team & Allocation",
      icon: UserCheck,
      view: "team" as const,
      badge:
        unassignedCount && unassignedCount > 0
          ? `${unassignedCount} queue`
          : "Active",
      badgeColor:
        unassignedCount && unassignedCount > 0
          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
          : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
      permission: "team" as const,
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800/80 min-h-screen">
      <div className="flex flex-col flex-1">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-emerald-400 text-white flex items-center justify-center font-black shadow-md shadow-indigo-500/25 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black text-white tracking-tight">
                  Prospect<span className="text-indigo-400">Pulse</span>
                </h1>
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                  CRM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal">
                Business prospecting
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 flex-1">
          <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Menu
          </div>
          {navItems
            .filter((item) => canAccess(item.permission))
            .map((item) => {
              const Icon = item.icon;
              const isActive =
                currentView === item.view ||
                (item.view === "leads" && currentView === "lead-details");

              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => onNavigate(item.view)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                    isActive
                      ? "bg-indigo-600/20 text-white shadow-xs border border-indigo-500/40"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/90"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? "text-indigo-400"
                          : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        item.badgeColor ||
                        (isActive
                          ? "bg-indigo-500/30 text-indigo-200"
                          : "bg-slate-800 text-slate-400")
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight
                      className={`w-3.5 h-3.5 opacity-30 group-hover:opacity-70 transition-opacity ${
                        isActive ? "opacity-90 text-indigo-300" : ""
                      }`}
                    />
                  )}
                </button>
              );
            })}
        </nav>
      </div>

      {/* Footer Info & User Session */}
      <div className="p-3 space-y-2.5 border-t border-slate-800/80 bg-slate-950">
        {currentUser ? (
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2">
            <div
              onClick={openAuthModal}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
              title="Click to manage accounts / switch user"
            >
              <div
                className="w-7 h-7 rounded-lg text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs"
                style={{
                  backgroundColor: currentUser.avatarColor || "#6366f1",
                }}
              >
                {currentUser.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-200 truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {isAdmin ? "👑 Admin" : "💼 Sales Rep"}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Sign In / Switch</span>
          </button>
        )}
      </div>
    </aside>
  );
};
