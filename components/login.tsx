"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ShieldCheck, UserCheck, Lock, Mail, User, IdCard, ArrowRight, CheckCircle2 } from "lucide-react";

export type BECRole = "Admin" | "RPM" | "Engineers" | "Technical Officer" | "Cable Technician";

export const ROLES: BECRole[] = [
  "Admin",
  "RPM",
  "Engineers",
  "Technical Officer",
  "Cable Technician",
];

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState<BECRole>("Engineers");

  // Designation Smart-Mapping helper function
  const autoMapRole = (empNo: string): BECRole => {
    const cleanNo = empNo.trim().toUpperCase();
    if (cleanNo.startsWith("AD") || cleanNo.startsWith("BE01")) return "Admin";
    if (cleanNo.startsWith("RPM") || cleanNo.startsWith("MG")) return "RPM";
    if (cleanNo.startsWith("ENG") || cleanNo.startsWith("CS55")) return "Engineers";
    if (cleanNo.startsWith("TO") || cleanNo.startsWith("CS53")) return "Technical Officer";
    if (cleanNo.startsWith("CT") || cleanNo.startsWith("TECH")) return "Cable Technician";
    return role;
  };

  const handleEmpNoChange = (val: string) => {
    setEmployeeId(val);
    const mapped = autoMapRole(val);
    if (mapped) setRole(mapped);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        if (!email || !password || !fullName || !employeeId) {
          throw new Error("Please complete all registration fields.");
        }

        // 1. Supabase Auth Sign Up with user_metadata
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              employee_id: employeeId.toUpperCase(),
              role: role,
            },
          },
        });

        if (signUpError) throw signUpError;

        const user = data.user;
        if (user) {
          // 2. Insert credential record securely inside Supabase 'profiles' table
          const { error: profileError } = await supabase.from("profiles").upsert([
            {
              id: user.id,
              email: email,
              full_name: fullName,
              employee_id: employeeId.toUpperCase(),
              role: role,
              created_at: new Date().toISOString(),
            },
          ]);

          if (profileError) {
            console.warn("Profiles table upsert warning:", profileError.message);
          }
        }

        setMessage("✅ Employee account registered successfully! Redirecting...");
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);

      } else {
        // Sign In
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          // Fetch or sync profile in 'profiles' table
          const userMeta = data.user.user_metadata || {};
          await supabase.from("profiles").upsert([
            {
              id: data.user.id,
              email: data.user.email,
              full_name: userMeta.full_name || email.split("@")[0],
              employee_id: userMeta.employee_id || "BE-EMP",
              role: userMeta.role || "Engineers",
            },
          ]);
        }

        setMessage("✅ Login successful! Loading corporate portal...");
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || "Authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Google sign-in error.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white font-sans py-12">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            BROWNS ENGINEERING &amp; CONSTRUCTION
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Employee ERP Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isSignUp
              ? "Register BEC Employee Number and Smart Designation Role"
              : "Access Role-Based Operational Telemetry & Control"}
          </p>
        </div>

        {/* Success / Error Banners */}
        {error && (
          <div className="mb-5 rounded-xl bg-red-500/10 p-3.5 text-xs text-red-400 border border-red-500/20 text-center font-medium">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-5 rounded-xl bg-emerald-500/10 p-3.5 text-xs text-emerald-400 border border-emerald-500/20 text-center font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {message}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. Sandun Harshana"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-amber-500"
                    required={isSignUp}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  BEC Employee Number (Smart Mapping)
                </label>
                <div className="relative">
                  <IdCard className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. BE0174, CS5583, CS5337"
                    value={employeeId}
                    onChange={(e) => handleEmpNoChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-amber-400 font-mono font-bold placeholder-slate-500 focus:outline-amber-500"
                    required={isSignUp}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Designation Tier
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as BECRole)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-amber-400 font-bold focus:outline-amber-500"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} className="bg-slate-900 text-white">
                      Role: {r}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Corporate Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                placeholder="name@browns.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-amber-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-amber-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg mt-2"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
            ) : (
              <>
                {isSignUp ? "Register Employee Credential" : "Sign In to ERP Portal"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>{isSignUp ? "Already registered?" : "New BEC employee?"}</span>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
            className="text-amber-400 font-bold hover:underline"
          >
            {isSignUp ? "Sign In Instead" : "Register Employee Profile"}
          </button>
        </div>

        {/* Google OAuth Alternative */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium rounded-xl text-xs transition flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4 text-amber-400" />
            Quick Access via Corporate Gmail
          </button>
        </div>

        <div className="mt-6 text-center text-[10px] text-slate-500">
          &copy; {new Date().getFullYear()} Browns Engineering &amp; Construction • Supabase RBAC
        </div>
      </div>
    </div>
  );
}
