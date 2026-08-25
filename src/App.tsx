import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar.js";
import { Header } from "./components/Header.js";
import { ToastProvider } from "./components/Toast.js";
import { AuthProvider } from "./context/AuthContext.js";
import { AuthModal } from "./components/AuthModal.js";
import { DashboardView } from "./views/DashboardView.js";
import { SearchView } from "./views/SearchView.js";
import { LeadsView } from "./views/LeadsView.js";
import { LeadDetailsView } from "./views/LeadDetailsView.js";
import { TeamView } from "./views/TeamView.js";

type ViewMode = "dashboard" | "search" | "leads" | "lead-details" | "team";

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewMode>("dashboard");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [activeRepFilter, setActiveRepFilter] = useState<string>("all");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync state with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash.startsWith("/leads/")) {
        const id = hash.replace("/leads/", "");
        if (id) {
          setSelectedLeadId(id);
          setCurrentView("lead-details");
          return;
        }
      }
      if (hash === "/search") {
        setCurrentView("search");
        setSelectedLeadId(null);
      } else if (hash === "/leads") {
        setCurrentView("leads");
        setSelectedLeadId(null);
      } else if (hash === "/team") {
        setCurrentView("team");
        setSelectedLeadId(null);
      } else {
        setCurrentView("dashboard");
        setSelectedLeadId(null);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigateTo = (view: "dashboard" | "search" | "leads" | "team") => {
    setSelectedLeadId(null);
    setCurrentView(view);
    setIsMobileSidebarOpen(false);
    if (view === "dashboard") window.location.hash = "/";
    else if (view === "search") window.location.hash = "/search";
    else if (view === "leads") {
      setActiveRepFilter("all");
      window.location.hash = "/leads";
    } else if (view === "team") window.location.hash = "/team";
  };

  const handleNavigateToLeadsWithFilter = (assignee: string) => {
    setActiveRepFilter(assignee);
    setCurrentView("leads");
    setSelectedLeadId(null);
    setIsMobileSidebarOpen(false);
    window.location.hash = "/leads";
  };

  const handleViewLeadDetails = (id: string) => {
    setSelectedLeadId(id);
    setCurrentView("lead-details");
    setIsMobileSidebarOpen(false);
    window.location.hash = `/leads/${id}`;
  };

  const getPageTitleAndSubtitle = () => {
    switch (currentView) {
      case "dashboard":
        return {
          title: "Dashboard Overview",
          subtitle: "Real-time database analytics and prospecting performance",
        };
      case "search":
        return {
          title: "Prospect Businesses",
          subtitle: "Live geographic query without mock or placeholder data",
        };
      case "leads":
        return {
          title: "Saved Leads CRM",
          subtitle:
            "Manage, assign reps, filter, export, and track business prospects",
        };
      case "lead-details":
        return {
          title: "Lead Dossier",
          subtitle:
            "Full database record attributes, rep assignment, and CRM notes",
        };
      case "team":
        return {
          title: "Team & Workload Allocation",
          subtitle:
            "Sales representatives roster, auto-assignment, and user credentials",
        };
      default:
        return { title: "ProspectPulse", subtitle: "" };
    }
  };

  const pageMeta = getPageTitleAndSubtitle();

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden antialiased selection:bg-indigo-600 selection:text-white">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar currentView={currentView} onNavigate={navigateTo} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-950 z-50 shadow-2xl">
            <Sidebar currentView={currentView} onNavigate={navigateTo} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
        <Header
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          onNavigate={navigateTo}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
          {currentView === "dashboard" && (
            <DashboardView
              onNavigate={navigateTo}
              onViewLeadDetails={handleViewLeadDetails}
              onNavigateToLeadsWithFilter={handleNavigateToLeadsWithFilter}
            />
          )}

          {currentView === "search" && (
            <SearchView onNavigateToLeads={() => navigateTo("leads")} />
          )}

          {currentView === "leads" && (
            <LeadsView
              onNavigateToSearch={() => navigateTo("search")}
              onViewLeadDetails={handleViewLeadDetails}
              initialAssignedFilter={activeRepFilter}
            />
          )}

          {currentView === "team" && (
            <TeamView
              onNavigateToLeadsWithFilter={handleNavigateToLeadsWithFilter}
              onNavigateToSearch={() => navigateTo("search")}
            />
          )}

          {currentView === "lead-details" && selectedLeadId && (
            <LeadDetailsView
              leadId={selectedLeadId}
              onBack={() => navigateTo("leads")}
              onLeadDeleted={() => navigateTo("leads")}
            />
          )}
        </main>
      </div>

      {/* User Authentication & Account Management Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
