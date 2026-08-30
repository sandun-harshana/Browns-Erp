"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardOverview() {
  const [stats, setTotalStats] = useState({
    activeProjects: 12,
    attendanceRate: "94.2%",
    pendingBills: 0,
    fuelConsumption: "4,280 L",
  });
  const [userName, setUserName] = useState("Sandun Harshana");

  useEffect(() => {
    // 1. Fetch current user session to show real name
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.user_metadata?.full_name) {
        setUserName(session.user.user_metadata.full_name);
      } else if (session?.user?.email) {
        setUserName(session.user.email.split('@')[0]);
      }
    });

    // 2. Fetch live pending bills total amount from Supabase
    const getLiveStats = async () => {
      const { data: billsData } = await supabase.from("bills").select("amount").eq("status", "Pending");
      if (billsData) {
        const totalPending = billsData.reduce((sum, item) => sum + Number(item.amount), 0);
        setTotalStats(prev => ({ ...prev, pendingBills: totalPending }));
      }
    };

    getLiveStats();
  }, []);

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Greeting */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Good morning, {userName}.</h1>
          <p className="text-slate-400 text-sm mt-1">Here's what's happening across Browns Engineering operations today.</p>
        </div>

        {/* Stats Grid with LKR (Rs.) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-xs uppercase text-slate-500 font-bold">Active Projects</p>
            <p className="text-2xl font-bold mt-2 text-amber-500">{stats.activeProjects}</p>
          </div>
          
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-xs uppercase text-slate-500 font-bold">Team Attendance</p>
            <p className="text-2xl font-bold mt-2 text-emerald-400">{stats.attendanceRate}</p>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-xs uppercase text-slate-500 font-bold">Pending Bills (Live Database)</p>
            <p className="text-2xl font-bold mt-2 text-red-400">Rs. {stats.pendingBills.toLocaleString()}</p>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-xs uppercase text-slate-500 font-bold">Fuel Consumption</p>
            <p className="text-2xl font-bold mt-2 text-blue-400">{stats.fuelConsumption}</p>
          </div>
        </div>

        {/* Informational Message */}
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center text-sm text-slate-400">
          💡 <b>Tip:</b> To populate real data here, navigate to <b>Attendance</b> or <b>Finance</b> tabs from the sidebar and use the <b>Import Excel CSV</b> button!
        </div>

      </div>
    </div>
  );
}
