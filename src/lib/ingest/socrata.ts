import { classifyPermit, estimateValue } from "./classifier";

interface SocrataPermit {
  permit_number?: string;
  permit_type?: string;
  application_type?: string;
  description?: string;
  address?: string;
  city?: string;
  zip?: string;
  zip_code?: string;
  issue_date?: string;
  application_date?: string;
  contractor_name?: string;
  contractor_license_number?: string;
  applicant_name?: string;
  owner_name?: string;
  status?: string;
  [key: string]: any;
}

export interface NormalizedPermit {
  source_permit_id: string;
  permit_type: string;
  category: string;
  address: string;
  city: string;
  zip_code: string;
  county: string;
  applicant_name: string;
  contractor_name: string;
  contractor_license: string;
  description: string;
  estimated_value: number;
  filed_date: string;
  status: string;
  raw_data: any;
}

export async function fetchSocrataPermits(
  endpoint: string,
  config: any,
  lastPullAt: string | null
): Promise<SocrataPermit[]> {
  const params = new URLSearchParams();
  params.set("$limit", String(config.limit || 1000));

  if (config.order) {
    params.set("$order", config.order);
  }

  if (lastPullAt) {
    const dateField = config.date_field || "issue_date";
    const dateStr = new Date(lastPullAt).toISOString().split("T")[0];
    params.set("$where", `${dateField} >= '${dateStr}'`);
  }

  const url = `${endpoint}?${params.toString()}`;
  console.log("Fetching Socrata:", url);

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(config.app_token ? { "X-App-Token": config.app_token } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Socrata API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export function normalizeSocrataPermit(
  raw: SocrataPermit,
  county: string
): NormalizedPermit | null {
  const permitId = raw.permit_number || raw.permitnumber || raw.permit_num || "";
  const address = raw.address || raw.project_address || raw.location || "";
  const description = raw.description || raw.work_description || raw.scope_of_work || "";
  const permitType = raw.permit_type || raw.application_type || raw.type || "";

  if (!permitId || !address) return null;

  const category = classifyPermit(permitType, description);

  return {
    source_permit_id: permitId,
    permit_type: permitType,
    category,
    address: address.trim(),
    city: (raw.city || "Orlando").trim(),
    zip_code: (raw.zip || raw.zip_code || raw.zipcode || "").trim().slice(0, 5),
    county,
    applicant_name: (raw.applicant_name || raw.owner_name || "").trim(),
    contractor_name: (raw.contractor_name || "").trim(),
    contractor_license: (raw.contractor_license_number || "").trim(),
    description: description.trim().slice(0, 500),
    estimated_value: estimateValue(category),
    filed_date: (raw.issue_date || raw.application_date || new Date().toISOString()).split("T")[0],
    status: raw.status || "active",
    raw_data: raw,
  };
}
