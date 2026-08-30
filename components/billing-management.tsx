"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Papa from "papaparse";
import { Filter, Upload, FileSpreadsheet, Check, AlertCircle } from "lucide-react";

interface BillRecord {
  id: string;
  bill_number: string;
  wbs_code?: string;
  description: string;
  amount: number;
  category: string;
  status: string;
  created_at?: string;
}

const WBS_CODES = [
  "All WBS Codes",
  "TEL-005.4",
  "TEL-004.3",
  "TEL-005.1",
  "BE-GEN-01",
  "BE-MAT-02",
];

export default function FinanceManagement() {
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedWbs, setSelectedWbs] = useState("All WBS Codes");

  // Form States
  const [billNum, setBillNum] = useState("");
  const [wbsCode, setWbsCode] = useState("TEL-005.4");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Petty Cash");
  const [status, setStatus] = useState("Pending");

  // Alert / Toast Notification State
  const [importNotification, setImportNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchBills();

    // Real-time updates subscription
    const channel = supabase
      .channel("realtime-bills")
      .on("postgres_changes", { event: "*", schema: "public", table: "bills" }, () => {
        fetchBills();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBills = async () => {
    try {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setBills(data);
    } catch (error: any) {
      console.error("Error fetching bills:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setImportNotification(msg);
    setTimeout(() => {
      setImportNotification(null);
    }, 4500);
  };

  // CSV Strict Validation & Import Handler
  const handleExcelImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rawData = results.data as Record<string, any>[];

        if (!rawData || rawData.length === 0) {
          alert("Selected CSV file contains no valid rows.");
          return;
        }

        const sanitizedRows: any[] = [];
        let parseCount = 0;

        rawData.forEach((row, idx) => {
          // Normalize header keys by lowercasing and trimming
          const cleanRow: Record<string, any> = {};
          Object.keys(row).forEach((k) => {
            cleanRow[k.trim().toLowerCase()] = row[k];
          });

          // Extract fields
          const rawBillNum = cleanRow["bill_number"] || cleanRow["bill number"] || cleanRow["bill_no"] || cleanRow["bill no"] || `CSV-IMP-${Date.now()}-${idx + 1}`;
          const rawWbs = cleanRow["wbs_code"] || cleanRow["wbs code"] || cleanRow["wbs"] || "TEL-005.4";
          const rawDesc = cleanRow["description"] || cleanRow["desc"] || "Imported Expenditure";
          const rawAmount = cleanRow["amount"] || cleanRow["cost"] || cleanRow["total"] || 0;
          const rawCategory = cleanRow["category"] || "Petty Cash";
          const rawStatus = cleanRow["status"] || "Pending";

          // Strict Sanitization
          // 1. Strip any currency symbols (Rs., LKR, $, commas, etc.) or non-numeric letters except decimal point
          const cleanedAmountStr = String(rawAmount).replace(/[^0-9.]/g, "");
          const parsedAmount = parseFloat(cleanedAmountStr);
          const finalAmount = isNaN(parsedAmount) ? 0 : parsedAmount;

          // 2. Set fallback values for empty strings
          const finalBillNum = String(rawBillNum).trim() || `CSV-IMP-${Date.now()}-${idx + 1}`;
          const finalWbs = String(rawWbs).trim() || "TEL-005.4";
          const finalDesc = String(rawDesc).trim() || "Imported Ledger Entry";
          const finalCategory = String(rawCategory).trim() || "Petty Cash";
          const finalStatus = String(rawStatus).trim() || "Pending";

          sanitizedRows.push({
            bill_number: finalBillNum,
            wbs_code: finalWbs,
            description: finalDesc,
            amount: finalAmount,
            category: finalCategory,
            status: finalStatus,
          });

          parseCount++;
        });

        // Insert rows into Supabase database
        try {
          const { error } = await supabase.from("bills").insert(sanitizedRows);
          if (error) {
            console.error("Supabase bulk insert error:", error);
            showToast(`⚠️ Insert warning: ${error.message}`);
          } else {
            showToast(`✅ Successfully parsed and inserted ${parseCount} bill records into database!`);
            fetchBills();
          }
        } catch (err: any) {
          showToast(`❌ Import Failed: ${err.message}`);
        }

        // Reset file input
        e.target.value = "";
      },
      error: (error) => {
        alert("CSV Parsing Error: " + error.message);
      },
    });
  };

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billNum || !desc || !amount) {
      alert("Please fill all fields");
      return;
    }

    try {
      const cleanAmtStr = String(amount).replace(/[^0-9.]/g, "");
      const cleanAmt = parseFloat(cleanAmtStr) || 0;

      // 1. Insert Data into Supabase
      const { error } = await supabase.from("bills").insert([
        {
          bill_number: billNum.trim(),
          wbs_code: wbsCode,
          description: desc.trim(),
          amount: cleanAmt,
          category: category,
          status: status,
        },
      ]);

      if (error) throw error;

      // 2. Clear Form Fields on success
      setBillNum("");
      setDesc("");
      setAmount("");
      showToast(`✅ Bill ${billNum} successfully recorded in system!`);
      fetchBills();
      
    } catch (error: any) {
      alert("Error adding bill: " + error.message);
    }
  };

  // Filter bills by WBS Project Code
  const filteredBills = bills.filter((b) => {
    if (selectedWbs === "All WBS Codes") return true;
    return b.wbs_code === selectedWbs;
  });

  // PDF Export Function
  const exportToPDF = () => {
    const doc = new jsPDF() as any;
    doc.text("Browns Engineering & Construction - Finance Report", 14, 15);
    
    const tableRows = filteredBills.map((b) => [
      b.bill_number,
      b.wbs_code || "TEL-005.4",
      b.description,
      b.category,
      `Rs. ${Number(b.amount || 0).toLocaleString()}`,
      b.status,
    ]);

    doc.autoTable({
      head: [["Bill No", "WBS Code", "Description", "Category", "Amount", "Status"]],
      body: tableRows,
      startY: 22,
    });

    doc.save(`Browns_Finance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Success / Warning Alert Toast */}
        {importNotification && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-4 rounded-xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="text-sm font-semibold">{importNotification}</span>
            </div>
            <button
              onClick={() => setImportNotification(null)}
              className="text-amber-400 hover:text-amber-200 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-amber-500">Browns Engineering & Construction</h1>
            <p className="text-slate-400 text-sm">Finance & Petty Cash Ledger Portal</p>
          </div>

          <div className="flex items-center gap-3">
            {/* CSV Import Button */}
            <label className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-semibold py-2 px-4 rounded-lg transition text-sm cursor-pointer inline-flex items-center gap-2 shadow-sm">
              <FileSpreadsheet className="w-4 h-4" />
              Import Excel CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleExcelImport}
                className="hidden"
              />
            </label>

            <button
              onClick={exportToPDF}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition text-sm shadow-sm"
            >
              Export Report to PDF
            </button>
          </div>
        </div>

        {/* Bill Entry Form */}
        <form onSubmit={handleAddBill} className="bg-slate-800 p-6 rounded-xl border border-slate-700 grid grid-cols-1 md:grid-cols-6 gap-4 shadow-xl">
          <h2 className="text-lg font-semibold md:col-span-6 text-slate-200">Update / Record New Bill</h2>
          
          <input
            type="text"
            placeholder="Bill/Voucher Number"
            value={billNum}
            onChange={(e) => setBillNum(e.target.value)}
            className="p-2.5 rounded bg-slate-700 border border-slate-600 text-white placeholder-slate-400 text-sm focus:outline-amber-500"
            required
          />

          <select
            value={wbsCode}
            onChange={(e) => setWbsCode(e.target.value)}
            className="p-2.5 rounded bg-slate-700 border border-slate-600 text-white text-sm focus:outline-amber-500"
          >
            {WBS_CODES.filter((c) => c !== "All WBS Codes").map((code) => (
              <option key={code} value={code}>
                WBS: {code}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Description of expenditure"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="p-2.5 rounded bg-slate-700 border border-slate-600 text-white placeholder-slate-400 text-sm focus:outline-amber-500"
            required
          />

          <input
            type="text"
            placeholder="Amount (LKR)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="p-2.5 rounded bg-slate-700 border border-slate-600 text-white placeholder-slate-400 text-sm focus:outline-amber-500"
            required
          />
          
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-2.5 rounded bg-slate-700 border border-slate-600 text-white text-sm focus:outline-amber-500"
          >
            <option value="Petty Cash">Petty Cash</option>
            <option value="Materials">Materials</option>
            <option value="Fuel">Fuel</option>
            <option value="Transport">Transport</option>
            <option value="Food">Food</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="p-2.5 rounded bg-slate-700 border border-slate-600 text-white text-sm focus:outline-amber-500"
          >
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Paid">Paid</option>
          </select>

          <button
            type="submit"
            className="md:col-span-6 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2.5 rounded-lg transition text-sm shadow-md"
          >
            Save Record &amp; Update Ledger
          </button>
        </form>

        {/* Bills Registry Table & Filter Header */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-200">Corporate Bills Ledger</h2>
              <p className="text-xs text-slate-400 mt-0.5">Showing {filteredBills.length} records</p>
            </div>

            {/* Feature 1: WBS Project Code Dropdown Selector */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
              <Filter className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs text-slate-400 font-medium">Filter WBS Code:</span>
              <select
                value={selectedWbs}
                onChange={(e) => setSelectedWbs(e.target.value)}
                className="bg-transparent text-amber-400 font-bold text-xs focus:outline-none cursor-pointer"
              >
                {WBS_CODES.map((code) => (
                  <option key={code} value={code} className="bg-slate-800 text-white">
                    {code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="p-6 text-center text-slate-400">Loading billing files...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-700/50 text-slate-300 text-sm">
                    <th className="p-3">Bill No</th>
                    <th className="p-3">WBS Code</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Amount (LKR)</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 text-slate-300">
                  {filteredBills.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500 text-sm">
                        No billing records found matching WBS Code: <b>{selectedWbs}</b>
                      </td>
                    </tr>
                  ) : (
                    filteredBills.map((b) => (
                      <tr key={b.id || b.bill_number} className="hover:bg-slate-700/30 transition text-sm">
                        <td className="p-3 font-semibold text-amber-400">{b.bill_number}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-700 text-amber-300 border border-slate-600">
                            {b.wbs_code || "TEL-005.4"}
                          </span>
                        </td>
                        <td className="p-3">{b.description}</td>
                        <td className="p-3 text-slate-400">{b.category}</td>
                        <td className="p-3 font-bold text-emerald-400">
                          Rs. {Number(b.amount || 0).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            b.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            b.status === 'Approved' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {b.status}
                          </span>
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
