"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import Papa from "papaparse";
import { Upload, FileSpreadsheet, CheckCircle, ShieldCheck, Users, AlertCircle, RefreshCw } from "lucide-react";

export type BECTier = "Admin" | "RPM" | "Engineers" | "Technical Officer" | "Cable Technician";

interface AttendanceRecord {
  id: string;
  employee_name: string;
  employee_id: string;
  designation: string;
  status: string;
  check_in_time: string;
}

/**
 * Strict Dynamic Designation Mapping & Prefix Fallback Security
 */
export function mapToOfficialTier(designationInput?: string, empIdInput?: string): BECTier {
  const des = (designationInput || "").trim().toLowerCase();
  const empId = (empIdInput || "").trim().toUpperCase();

  if (des) {
    if (des.includes("admin") || des.includes("administrator") || des.includes("director") || des.includes("head")) {
      return "Admin";
    }
    if (des.includes("rpm") || des.includes("regional") || des.includes("project manager") || des.includes("pm")) {
      return "RPM";
    }
    if (des.includes("engineer") || des.includes("civil") || des.includes("mech") || des.includes("electrical") || des.includes("site eng")) {
      return "Engineers";
    }
    if (des.includes("technical") || des.includes("officer") || des.includes("to") || des.includes("foreman") || des.includes("surveyor") || des.includes("supervisor") || des.includes("inspector")) {
      return "Technical Officer";
    }
    if (des.includes("cable") || des.includes("technician") || des.includes("joiner") || des.includes("lineman") || des.includes("splicer") || des.includes("rigger") || des.includes("fitter")) {
      return "Cable Technician";
    }
  }

  // Fallback Security: Read Employee ID string prefix
  if (empId.startsWith("CS")) {
    return "Cable Technician";
  } else if (empId.startsWith("BE")) {
    return "Engineers";
  } else if (empId.startsWith("RPM")) {
    return "RPM";
  } else if (empId.startsWith("ADM")) {
    return "Admin";
  }

  return "Technical Officer"; // Dynamic corporate fallback tier
}

export default function AttendanceManagement() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [importSummary, setImportSummary] = useState<{ total: number; tiers: Record<string, number> } | null>(null);

  // Form States for Manual Entry
  const [empName, setEmpName] = useState("");
  const [empId, setEmpId] = useState("");
  const [designation, setDesignation] = useState<BECTier>("Engineers");
  const [status, setStatus] = useState("Present");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAttendance();

    const channel = supabase
      .channel("realtime-attendance-roster")
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
      if (data) setRecords(data);
    } catch (error: any) {
      console.error("Fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  // Manual Attendance Entry
  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empId) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const mappedTier = mapToOfficialTier(designation, empId);
      const { error } = await supabase.from("attendance").insert([
        {
          employee_name: empName,
          employee_id: empId,
          designation: mappedTier,
          status: status,
        },
      ]);

      if (error) throw error;

      setEmpName("");
      setEmpId("");
      showToast(`Added ${empName} (${empId}) as ${mappedTier}`);
    } catch (error: any) {
      alert("Error marking attendance: " + error.message);
    }
  };

  // Admin Bulk Upload Excel (.csv) Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedData = results.data as Record<string, string>[];
          const rowsToInsert: { employee_name: string; employee_id: string; designation: string; status: string }[] = [];
          const tierCounts: Record<string, number> = {
            Admin: 0,
            RPM: 0,
            Engineers: 0,
            "Technical Officer": 0,
            "Cable Technician": 0,
          };

          parsedData.forEach((row) => {
            const id = (
              row["BEC No"] ||
              row["Employee ID"] ||
              row["BEC_No"] ||
              row["Emp ID"] ||
              row["Employee_ID"] ||
              row["ID"] ||
              ""
            ).trim();

            const name = (
              row["Employee Name"] ||
              row["Full Name"] ||
              row["Employee_Name"] ||
              row["Name"] ||
              "BEC Staff Member"
            ).trim();

            const rawDesignation = (
              row["Designation"] ||
              row["Role"] ||
              row["Position"] ||
              row["Job Title"] ||
              ""
            ).trim();

            if (id || name) {
              // Smart Auto-Fill & Strict Tier Mapping
              const mappedTier = mapToOfficialTier(rawDesignation, id);
              tierCounts[mappedTier] = (tierCounts[mappedTier] || 0) + 1;

              rowsToInsert.push({
                employee_name: name,
                employee_id: id || `BE-${Math.floor(1000 + Math.random() * 9000)}`,
                designation: mappedTier,
                status: "Present",
              });
            }
          });

          if (rowsToInsert.length === 0) {
            alert("No valid employee rows found in CSV. Please verify column headers ('BEC No', 'Employee Name', 'Designation').");
            setUploading(false);
            return;
          }

          // Insert into Supabase 'attendance' table
          const { error: attendanceErr } = await supabase.from("attendance").insert(rowsToInsert);
          if (attendanceErr) throw attendanceErr;

          setImportSummary({
            total: rowsToInsert.length,
            tiers: tierCounts,
          });

          showToast(
            `Successfully imported and auto-filled ${rowsToInsert.length} total staff profiles across official corporate tiers!`
          );

          fetchAttendance();
        } catch (err: any) {
          alert("Error importing staff CSV: " + err.message);
        } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (error) => {
        alert("CSV Parsing Error: " + error.message);
        setUploading(false);
      },
    });
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-900 min-h-screen text-white rounded-2xl border border-slate-800">
      {/* Header & Bulk Upload Controls */}
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-500" />
              <h1 className="text-2xl font-bold text-white">Staff Management & Roster</h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Browns Engineering & Construction — Corporate Tier Telemetry & Roster Sync
            </p>
          </div>

          {/* Admin Bulk Upload CSV Button */}
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="admin-csv-upload-input"
            />
            <label
              htmlFor="admin-csv-upload-input"
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition shadow-lg ${
                uploading
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/10"
              }`}
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  Auto-Filling Corporate Tiers...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 text-slate-950" />
                  Admin Bulk Upload Excel (.csv)
                </>
              )}
            </label>
          </div>
        </div>

        {/* Real-Time Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Import Summary Pill Indicator */}
        {importSummary && (
          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Latest Corporate Tier Auto-Fill Summary
              </span>
              <span className="text-xs bg-slate-700 px-2.5 py-1 rounded-full text-slate-300 font-semibold">
                {importSummary.total} Profiles Auto-Mapped
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {Object.entries(importSummary.tiers).map(([tier, count]) => (
                <div key={tier} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-xs text-slate-400">{tier}</div>
                  <div className="text-lg font-bold text-amber-400 mt-1">{count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Employee Quick Add */}
        <form onSubmit={handleMarkAttendance} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Quick Manual Employee Add</h2>
            <p className="text-xs text-slate-400">Designations automatically validate into official company tiers.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Employee ID</label>
            <input
              type="text"
              placeholder="e.g. BE0174 or CS5583"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:border-amber-500 text-white"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Employee Name</label>
            <input
              type="text"
              placeholder="e.g. Sandun Harshana"
              value={empName}
              onChange={(e) => setEmpName(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:border-amber-500 text-white"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Official Corporate Tier</label>
            <select
              value={designation}
              onChange={(e) => setDesignation(e.target.value as BECTier)}
              className="w-full p-2.5 text-xs rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:border-amber-500 text-white"
            >
              <option value="Admin">Admin</option>
              <option value="RPM">RPM (Regional Project Manager)</option>
              <option value="Engineers">Engineers</option>
              <option value="Technical Officer">Technical Officer</option>
              <option value="Cable Technician">Cable Technician</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:border-amber-500 text-white"
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-slate-700 hover:bg-slate-600 text-amber-400 font-bold py-2.5 px-4 rounded-xl text-xs border border-amber-500/30 transition"
            >
              Add Record
            </button>
          </div>
        </form>

        {/* Staff Table */}
        <div className="bg-slate-800/40 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Browns Active Staff Roster ({records.length})
            </h2>
            <span className="text-xs text-slate-400">Auto-synced with Supabase</span>
          </div>

          {loading ? (
            <p className="p-8 text-center text-slate-400 text-xs">Loading employee roster...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-400 text-xs font-semibold">
                    <th className="p-3.5">BEC ID</th>
                    <th className="p-3.5">Employee Name</th>
                    <th className="p-3.5">Official Tier / Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 text-xs">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No employee records found. Upload an Excel CSV file above to auto-fill the roster.
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => {
                      const tier = mapToOfficialTier(r.designation, r.employee_id);
                      return (
                        <tr key={r.id} className="hover:bg-slate-800/50 transition">
                          <td className="p-3.5 font-bold text-amber-400">{r.employee_id}</td>
                          <td className="p-3.5 font-medium text-white">{r.employee_name}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-block ${
                                tier === "Admin"
                                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                  : tier === "RPM"
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  : tier === "Engineers"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : tier === "Technical Officer"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                              }`}
                            >
                              {tier}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                                r.status === "Present"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : r.status === "Absent"
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-400 text-[11px]">
                            {r.check_in_time ? new Date(r.check_in_time).toLocaleString() : "Just now"}
                          </td>
                        </tr>
                      );
                    })
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
