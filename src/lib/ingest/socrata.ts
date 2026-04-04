import { classifyPermit, estimateValue } from "./classifier";

export async function fetchSocrataPermits(endpoint: string, config: any, lastPullAt: string | null) {
  const params = new URLSearchParams();
  params.set("$limit", String(config.limit || 1000));
  if (config.order) params.set("$order", config.order);
  if (lastPullAt) {
    const dateField = config.date_field || "processed_date";
    const dateStr = new Date(lastPullAt).toISOString().split("T")[0];
    params.set("$where", dateField + " >= '" + dateStr + "'");
  }
  const url = endpoint + "?" + params.toString();
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Socrata error: " + res.status);
  return res.json();
}

export function normalizeSocrataPermit(raw: any, county: string) {
  const permitId = raw.permit_number || "";
  const address = raw.permit_address || "";
  const description = (raw.worktype || "") + " " + (raw.project_name || "") + " " + (raw.application_type || "");
  const permitType = raw.application_type || "";
  if (!permitId || !address) return null;
  const category = classifyPermit(permitType, description);
  
  let zipCode = "";
  const latLng = raw["permit_address_lat/long"] || raw.permit_address_lat_long || "";
  
  return {
    source_permit_id: permitId,
    permit_type: permitType,
    category: category,
    address: address.trim(),
    city: "Orlando",
    zip_code: zipCode,
    county: county,
    applicant_name: (raw.property_owner_name || "").trim(),
    contractor_name: (raw.contractor_name || raw.contractor || "").trim(),
    contractor_license: "",
    description: description.trim().slice(0, 500),
    estimated_value: Number(raw.estimated_cost) > 0 ? Number(raw.estimated_cost) : estimateValue(category),
    filed_date: (raw.processed_date || raw.issue_permit_date || new Date().toISOString()).split("T")[0],
    status: (raw.application_status || "active").toLowerCase(),
    raw_data: raw,
  };
}
