import React, { useEffect, useState } from "react";
import {
  X,
  Lock,
  Mail,
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  Key,
  LogIn,
  UserPlus,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.js";
import { UserRole } from "../types/index.js";
import { useToast } from "./Toast.js";

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    login,
    registerUser,
    currentUser,
    logout,
  } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("sales_rep");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    if (currentUser?.role !== "admin" && mode === "register") {
      setMode("login");
    }
  }, [currentUser, mode]);

  if (!isAuthModalOpen) return null;

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setIsSubmitting(true);
    setError(null);

    const result = await login(quickEmail, quickPass);
    setIsSubmitting(false);

    if (result.success) {
      showToast(`Logged in successfully!`, "success");
      closeAuthModal();
    } else {
      setError(result.message || "Login failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (mode === "login") {
      const result = await login(email, password);
      setIsSubmitting(false);

      if (result.success) {
        showToast(result.message || "Logged in successfully", "success");
        closeAuthModal();
      } else {
        setError(result.message || "Invalid email or password");
      }
    } else {
      const result = await registerUser({
        name,
        email,
        password,
        role,
        phone,
      });
      setIsSubmitting(false);

      if (result.success) {
        showToast(`User ${name} created successfully!`, "success");
        // Auto-login with the newly created account
        await login(email, password);
        closeAuthModal();
      } else {
        setError(result.message || "Failed to create user");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={closeAuthModal}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200/90 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                {mode === "login"
                  ? "Account Authentication"
                  : "Create New User"}
              </h3>
              <p className="text-[11px] text-slate-500">
                {mode === "login"
                  ? "Sign in as Admin or Sales Representative"
                  : "Register a new team member credential"}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Logged In Status Banner */}
        {currentUser && (
          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center"
                style={{
                  backgroundColor: currentUser.avatarColor || "#6366f1",
                }}
              >
                {currentUser.name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{currentUser.name}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase bg-indigo-200/80 text-indigo-900">
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {currentUser.email}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                showToast("Signed out", "info");
              }}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Quick Demo Logins Section */}
        {currentUser?.role === "admin" && (
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>1-Click Fast Login / Switch Account:</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* Akhilesh (Admin) */}
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin("akhilesh@gmail.com", "akhilesh")
                }
                className="w-full p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-left flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    👑
                  </span>
                  <div>
                    <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <span>Akhilesh</span>
                      <span className="text-[9px] font-extrabold bg-amber-200 text-amber-900 px-1.5 rounded-sm">
                        ADMIN
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-800/80 font-mono">
                      akhilesh@gmail.com (pass: akhilesh)
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Dhananjay (Sales Rep) */}
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin("dhananjay@company.sales", "password123")
                }
                className="w-full p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-left flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    D
                  </span>
                  <div>
                    <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>Dhananjay</span>
                      <span className="text-[9px] font-extrabold bg-emerald-200 text-emerald-900 px-1.5 rounded-sm">
                        REP
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-800/80 font-mono">
                      dhananjay@company.sales
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Harsh (Sales Rep) */}
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin("harsh@company.sales", "password123")
                }
                className="w-full p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 text-left flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    H
                  </span>
                  <div>
                    <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <span>Harsh</span>
                      <span className="text-[9px] font-extrabold bg-indigo-200 text-indigo-900 px-1.5 rounded-sm">
                        REP
                      </span>
                    </div>
                    <div className="text-[10px] text-indigo-800/80 font-mono">
                      harsh@company.sales
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200" />
          <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">
            Or Manual {mode === "login" ? "Login" : "Registration"}
          </span>
          <div className="flex-grow border-t border-slate-200" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {mode === "register" && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-semibold text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-semibold text-slate-900 outline-none cursor-pointer"
                  >
                    <option value="sales_rep">💼 Sales Rep</option>
                    <option value="admin">👑 Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-semibold text-slate-900 outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-semibold text-slate-900 outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="auth-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-semibold text-slate-900 outline-none"
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === "login" ? (
              <LogIn className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            <span>{mode === "login" ? "Sign In" : "Create User & Log In"}</span>
          </button>
        </form>

        {/* Toggle Mode Footer */}
        {currentUser?.role === "admin" && (
          <div className="text-center pt-2 border-t border-slate-100">
            {mode === "login" ? (
              <p className="text-xs text-slate-500">
                Need to add another user?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                >
                  Register New User
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Already have credentials?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
