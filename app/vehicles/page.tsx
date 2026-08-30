"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  assigned_driver: string;
  current_mileage: number;
  fuel_card_number: string;
  fuel_balance: number;
}

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [driver, setDriver] = useState("");
  const [mileage, setMileage] = useState(0);
  const [fuelCard, setFuelCard] = useState("");
  const [fuelBalance, setFuelBalance] = useState(0);

  // 1. Fetch Vehicles from Supabase on Load
  useEffect(() => {
    fetchVehicles();

    // Setup Real-time listener so changes update instantly
    const channel = supabase
      .channel("realtime-vehicles")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "vehicles" },
        () => {
          fetchVehicles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        const typedVehicles: Vehicle[] = data.map((v: Record<string, any>) => ({
          id: String(v.id ?? ""),
          vehicle_number: String(v.vehicle_number ?? "WP CAS-0000"),
          vehicle_type: String(v.vehicle_type ?? "Tipper"),
          assigned_driver: String(v.assigned_driver ?? "Unassigned"),
          current_mileage: Number(v.current_mileage ?? 0),
          fuel_card_number: String(v.fuel_card_number ?? "N/A"),
          fuel_balance: Number(v.fuel_balance ?? 0),
        }));
        setVehicles(typedVehicles);
      }
    } catch (error: any) {
      alert("Error fetching vehicles: " + (error?.message ?? "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // 2. Insert New Vehicle into Supabase
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber || !vehicleType) {
      alert("Please enter Vehicle Number and Type");
      return;
    }

    try {
      const { error } = await supabase.from("vehicles").insert([
        {
          vehicle_number: vehicleNumber,
          vehicle_type: vehicleType,
          assigned_driver: driver,
          current_mileage: mileage,
          fuel_card_number: fuelCard,
          fuel_balance: fuelBalance,
        },
      ]);

      if (error) throw error;

      // Clear Form Fields
      setVehicleNumber("");
      setVehicleType("");
      setDriver("");
      setMileage(0);
      setFuelCard("");
      setFuelBalance(0);
      
      alert("Vehicle added successfully!");
    } catch (error: any) {
      alert("Error adding vehicle: " + (error?.message ?? "Unknown error"));
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-amber-500">Browns Engineering & Construction</h1>
          <p className="text-slate-400 text-sm">Vehicle Fleet & Fuel Management Portal</p>
        </div>

        {/* Add New Vehicle Form */}
        <form onSubmit={handleAddVehicle} className="bg-slate-800 p-6 rounded-xl border border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
          <h2 className="text-lg font-semibold md:col-span-3 text-slate-200">Add New Fleet Vehicle</h2>
          
          <input type="text" placeholder="Vehicle Number (e.g. WP CAS-1234)" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className="p-2.5 rounded bg-slate-700 border border-slate-600 focus:outline-amber-500" required />
          <input type="text" placeholder="Vehicle Type (e.g. Tipper, JCB)" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="p-2.5 rounded bg-slate-700 border border-slate-600 focus:outline-amber-500" required />
          <input type="text" placeholder="Assigned Driver Name" value={driver} onChange={(e) => setDriver(e.target.value)} className="p-2.5 rounded bg-slate-700 border border-slate-600 focus:outline-amber-500" />
          <input type="number" placeholder="Current Odometer (KM)" value={mileage || ""} onChange={(e) => setMileage(Number(e.target.value))} className="p-2.5 rounded bg-slate-700 border border-slate-600 focus:outline-amber-500" />
          <input type="text" placeholder="Fuel Card Number" value={fuelCard} onChange={(e) => setFuelCard(e.target.value)} className="p-2.5 rounded bg-slate-700 border border-slate-600 focus:outline-amber-500" />
          <input type="number" placeholder="Initial Fuel Card Balance (LKR)" value={fuelBalance || ""} onChange={(e) => setFuelBalance(Number(e.target.value))} className="p-2.5 rounded bg-slate-700 border border-slate-600 focus:outline-amber-500" />
          
          <button type="submit" className="md:col-span-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2.5 rounded transition">
            Save Vehicle to System
          </button>
        </form>

        {/* Fleet Data Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-slate-200">Active Vehicle List (Real-time)</h2>
          </div>
          
          {loading ? (
            <p className="p-6 text-center text-slate-400">Loading fleet data...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-700/50 text-slate-300 text-sm">
                    <th className="p-3">Vehicle Number</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Driver</th>
                    <th className="p-3">Mileage (KM)</th>
                    <th className="p-3">Fuel Card No.</th>
                    <th className="p-3">Card Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 text-slate-300">
                  {vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-500">No vehicles tracked yet.</td>
                    </tr>
                  ) : (
                    vehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-700/30 transition text-sm">
                        <td className="p-3 font-semibold text-amber-400">{v.vehicle_number}</td>
                        <td className="p-3">{v.vehicle_type}</td>
                        <td className="p-3">{v.assigned_driver || "N/A"}</td>
                        <td className="p-3">{(v.current_mileage ?? 0).toLocaleString()} KM</td>
                        <td className="p-3">{v.fuel_card_number || "N/A"}</td>
                        <td className="p-3 text-emerald-400">Rs. {(v.fuel_balance ?? 0).toLocaleString()}</td>
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
