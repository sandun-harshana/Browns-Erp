"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface AttendanceRecord {
  id: string;
  employee_name: string;
  employee_id: string;
  designation: string;
  status: string;
  check_in_time: string;
}

export default function AttendanceManagement() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [empName, setEmpName] = useState("");
  const [empId, setEmpId] = useState("");
  const [designation, setDesignation] = useState("");
  const [status, setStatus] = useState("Present");

  // Fetch Data from Supabase
  useEffect(() => {
    fetchAttendance();

    // Real-time update subscription
    const channel = supabase
      .channel("realtime-attendance")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => {
        fetchAttendance();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        const typedRecords: AttendanceRecord[] = data.map((item: Record<string, any>) => ({
          id: String(item.id ?? ""),
          employee_name: String(item.employee_name ?? item["Name"] ?? "Unknown"),
          employee_id: String(item.employee_id ?? item["BEC No"] ?? "BR-000"),
          designation: String(item.designation ?? item["Designation"] ?? "Employee"),
          status: String(item.status ?? "Present"),
          check_in_time: String(item.check_in_time ?? item.created_at ?? new Date().toISOString()),
        }));
        setRecords(typedRecords);
      }
    } catch (error: any) {
      alert("Error: " + (error?.message ?? "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Mark Attendance
  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empId || !designation) {
      alert("Please fill all fields");
      return;
    }

    try {
      const { error } = await supabase.from("attendance").insert([
        {
          employee_name: empName,
          employee_id: empId,
          designation: designation,
          status: status,
        },
      ]);

      if (error) throw error;

      setEmpName("");
      setEmpId("");
      setDesignation("");
      alert("Attendance marked successfully!");
    } catch (error: any) {
      alert("Error marking attendance: " + (error?.message ?? "Unknown error"));
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-amber-500">Browns Engineering & Construction</h1>
          <p className="text-slate-400 text-sm">Daily Employee Attendance Registry</p>
        </div>

        {/* Mark Attendance Form */}
        <form onSubmit={handleMarkAttendance} className="bg-slate-800 p-6 rounded-xl border border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4">
          <h2 className="text-lg font-semibold md:col-span-4 text-slate-200">Mark Daily Attendance</h2>
          
          <input type="text" placeholder="Employee Name" value={empName} onChange={(e) => setEmpName(e.target.value)} className="p-2.5 rounded bg-slate-700 border border-slate-600 focus:outline-amber-500" required />
          <input type="text" placeholder="Employee ID (e.g. BR-102)" value={empId} onChange={(e) => setEmpId(e.target.value)} className="p-2.5 rounded bg-slate-700 border border-slate-600 focus:outline-amber-500" required />
          <input type="text" placeholder="Designation (e.g. Mason)" value={designation} onChange={(e) => setDesignation(e.target.value)} className="p-2.5 rounded bg-slate-700 border border-slate-600 focus:outline-amber-500" required />
          
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="p-2.5 rounded bg-slate-700 border border-slate-600 focus:outline-amber-500 text-white">
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="On Leave">On Leave</option>
          </select>

          <button type="submit" className="md:col-span-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2.5 rounded transition">
            Save Attendance Record
          </button>
        </form>

        {/* Attendance List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-slate-200">Today's Attendance Logs (Real-time)</h2>
          </div>

          {loading ? (
            <p className="p-6 text-center text-slate-400">Loading attendance data...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-700/50 text-slate-300 text-sm">
                    <th className="p-3">Emp ID</th>
                    <th className="p-3">Employee Name</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 text-slate-300">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500">No attendance records found for today.</td>
                    </tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-700/30 transition text-sm">
                        <td className="p-3 font-semibold text-amber-400">{r.employee_id}</td>
                        <td className="p-3 font-medium">{r.employee_name}</td>
                        <td className="p-3 text-slate-400">{r.designation}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            r.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                            r.status === 'Absent' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 text-xs">
                          {r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString() : "N/A"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
