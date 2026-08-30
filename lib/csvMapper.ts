/**
 * Strict Type-Safe CSV & Data Mapper Framework
 * Enforces explicit field type checking and absolute fallback defaults.
 */

export interface EmployeeCsvRow {
  becNo: string;
  designation: string;
  name: string;
  department: string;
  role: string;
  status: string;
}

export interface VehicleCsvRow {
  vehicleNumber: string;
  vehicleType: string;
  assignedDriver: string;
  currentMileage: number;
  fuelCardNumber: string;
  fuelBalance: number;
}

/**
 * Maps raw CSV row objects (e.g., from Papa Parse) into fully functional, type-safe models.
 * Strictly checks `row["BEC No"]` and `row["Designation"]` with absolute fallbacks.
 */
export function mapEmployeeCsvRow(row: Record<string, unknown>): EmployeeCsvRow {
  const rawBecNo = row["BEC No"] ?? row["bec_no"] ?? row["Employee ID"] ?? "";
  const rawDesignation = row["Designation"] ?? row["designation"] ?? row["Role"] ?? "";
  const rawName = row["Name"] ?? row["employee_name"] ?? row["Full Name"] ?? "";
  const rawDept = row["Department"] ?? row["department"] ?? "";
  const rawRole = row["Role"] ?? row["role"] ?? "Employee";
  const rawStatus = row["Status"] ?? row["status"] ?? "Active";

  return {
    becNo: typeof rawBecNo === "string" ? rawBecNo.trim() : String(rawBecNo ?? "BEC-0000"),
    designation: typeof rawDesignation === "string" ? rawDesignation.trim() : String(rawDesignation ?? "Staff"),
    name: typeof rawName === "string" ? rawName.trim() : String(rawName ?? "Unknown Employee"),
    department: typeof rawDept === "string" ? rawDept.trim() : String(rawDept ?? "General"),
    role: typeof rawRole === "string" ? rawRole.trim() : String(rawRole ?? "Employee"),
    status: typeof rawStatus === "string" ? rawStatus.trim() : String(rawStatus ?? "Active"),
  };
}

/**
 * Maps vehicle CSV rows with explicit type coercion and fallback defaults.
 */
export function mapVehicleCsvRow(row: Record<string, unknown>): VehicleCsvRow {
  const rawVehicleNum = row["Vehicle Number"] ?? row["vehicle_number"] ?? "";
  const rawVehicleType = row["Vehicle Type"] ?? row["vehicle_type"] ?? "";
  const rawDriver = row["Assigned Driver"] ?? row["assigned_driver"] ?? "";
  const rawMileage = row["Current Mileage"] ?? row["current_mileage"] ?? 0;
  const rawFuelCard = row["Fuel Card Number"] ?? row["fuel_card_number"] ?? "";
  const rawFuelBalance = row["Fuel Balance"] ?? row["fuel_balance"] ?? 0;

  return {
    vehicleNumber: typeof rawVehicleNum === "string" ? rawVehicleNum.trim() : String(rawVehicleNum ?? "N/A"),
    vehicleType: typeof rawVehicleType === "string" ? rawVehicleType.trim() : String(rawVehicleType ?? "General Vehicle"),
    assignedDriver: typeof rawDriver === "string" ? rawDriver.trim() : String(rawDriver ?? "Unassigned"),
    currentMileage: typeof rawMileage === "number" ? rawMileage : (parseFloat(String(rawMileage)) || 0),
    fuelCardNumber: typeof rawFuelCard === "string" ? rawFuelCard.trim() : String(rawFuelCard ?? "N/A"),
    fuelBalance: typeof rawFuelBalance === "number" ? rawFuelBalance : (parseFloat(String(rawFuelBalance)) || 0),
  };
}

/**
 * Safe string cast helper with absolute fallback value.
 */
export function safeString(value: unknown, fallback: string = ""): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value.trim();
  return String(value);
}

/**
 * Safe number cast helper with absolute fallback value.
 */
export function safeNumber(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number" && !isNaN(value)) return value;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? fallback : parsed;
}
