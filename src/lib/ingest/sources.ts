/**
 * Verified Socrata open-data endpoints for building permits.
 * Every endpoint here has been tested and returns JSON rows.
 *
 * field_map tells the normaliser which raw field maps to each canonical field.
 * All fields are optional — the normaliser falls back to "" / null.
 */

export interface FieldMap {
  permit_id: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  permit_type?: string;
  description?: string;
  applicant?: string;
  contractor?: string;
  contractor_license?: string;
  value?: string;
  filed_date?: string;
  issued_date?: string;
  status?: string;
  latitude?: string;
  longitude?: string;
}

export interface DataSource {
  id: string;           // unique slug
  name: string;         // human label
  region: string;       // city / county / state
  state: string;        // 2-letter
  endpoint: string;     // Socrata resource URL
  date_field: string;   // field used for incremental $where
  order: string;        // $order clause
  field_map: FieldMap;
}

const SOURCES: DataSource[] = [
  // ── Florida ──────────────────────────────────────
  {
    id: "gainesville_fl",
    name: "Gainesville FL Permits",
    region: "Gainesville",
    state: "FL",
    endpoint: "https://data.cityofgainesville.org/resource/p798-x3nx.json",
    date_field: "issue",
    order: "issue DESC",
    field_map: {
      permit_id: "permit",
      address: "address",
      city: "city",
      state: "state",
      permit_type: "type",
      description: "subtype",
      applicant: "primary_party",
      contractor: "contractor",
      filed_date: "submit",
      issued_date: "issue",
    },
  },

  // ── Texas ────────────────────────────────────────
  {
    id: "austin_tx",
    name: "Austin TX Permits",
    region: "Austin",
    state: "TX",
    endpoint: "https://data.austintexas.gov/resource/3syk-w9eu.json",
    date_field: "issue_date",
    order: "issue_date DESC",
    field_map: {
      permit_id: "permit_number",
      address: "original_address1",
      city: "original_city",
      state: "original_state",
      zip: "original_zip",
      permit_type: "permittype",
      description: "description",
      contractor: "contractor_name",
      value: "total_job_valuation",
      filed_date: "applieddate",
      issued_date: "issue_date",
      status: "status_current",
      latitude: "latitude",
      longitude: "longitude",
    },
  },
  {
    id: "dallas_tx",
    name: "Dallas TX Permits",
    region: "Dallas",
    state: "TX",
    endpoint: "https://www.dallasopendata.com/resource/e7gq-4sah.json",
    date_field: "issued_date",
    order: "issued_date DESC",
    field_map: {
      permit_id: "permit_number",
      address: "street_address",
      zip: "zip_code",
      permit_type: "permit_type",
      description: "work_description",
      contractor: "contractor",
      value: "value",
      issued_date: "issued_date",
    },
  },
  {
    id: "collin_cad_tx",
    name: "Collin County TX Permits",
    region: "Collin County",
    state: "TX",
    endpoint: "https://data.texas.gov/resource/82ee-gbj5.json",
    date_field: "permitissueddate",
    order: "permitissueddate DESC",
    field_map: {
      permit_id: "permitnum",
      address: "propabssubname",
      permit_type: "permittypedescr",
      description: "permitcomments",
      contractor: "permitbuildername",
      applicant: "propownername",
      value: "permitvalue",
      issued_date: "permitissueddate",
    },
  },

  // ── Illinois ─────────────────────────────────────
  {
    id: "chicago_il",
    name: "Chicago IL Permits",
    region: "Chicago",
    state: "IL",
    endpoint: "https://data.cityofchicago.org/resource/ydr8-5enu.json",
    date_field: "issue_date",
    order: "issue_date DESC",
    field_map: {
      permit_id: "permit_",
      address: "street_number",  // combined in normalizer
      city: "_city",
      permit_type: "permit_type",
      description: "work_description",
      contractor: "contractor_1_name",
      value: "reported_cost",
      filed_date: "application_start_date",
      issued_date: "issue_date",
      latitude: "latitude",
      longitude: "longitude",
    },
  },

  // ── California ───────────────────────────────────
  {
    id: "sf_ca",
    name: "San Francisco CA Permits",
    region: "San Francisco",
    state: "CA",
    endpoint: "https://data.sfgov.org/resource/i98e-djp9.json",
    date_field: "filed_date",
    order: "filed_date DESC",
    field_map: {
      permit_id: "permit_number",
      address: "street_number",  // combined in normalizer
      permit_type: "permit_type_definition",
      description: "description",
      value: "estimated_cost",
      filed_date: "filed_date",
      issued_date: "issued_date",
      status: "status",
    },
  },
  {
    id: "marin_ca",
    name: "Marin County CA Permits",
    region: "Marin County",
    state: "CA",
    endpoint: "https://data.marincounty.gov/resource/mkbn-caye.json",
    date_field: "issued_date",
    order: "issued_date DESC",
    field_map: {
      permit_id: "permit_number",
      address: "address",
      city: "city_town",
      zip: "zipcode",
      permit_type: "type_permit",
      description: "description",
      contractor: "contractor",
      value: "construction_value",
      filed_date: "received_date",
      issued_date: "issued_date",
    },
  },

  // ── New York ─────────────────────────────────────
  {
    id: "nyc_ny",
    name: "New York City Permits",
    region: "New York City",
    state: "NY",
    endpoint: "https://data.cityofnewyork.us/resource/ic3t-wcy2.json",
    date_field: "latest_action_date",
    order: "latest_action_date DESC",
    field_map: {
      permit_id: "job__",
      address: "house__",  // combined in normalizer
      permit_type: "job_type",
      description: "job_description",
      applicant: "owner_s_first_name",
      value: "initial_cost",
      filed_date: "pre__filing_date",
      issued_date: "latest_action_date",
      status: "job_status_descrp",
    },
  },

  // ── Washington ───────────────────────────────────
  {
    id: "seattle_wa",
    name: "Seattle WA Permits",
    region: "Seattle",
    state: "WA",
    endpoint: "https://cos-data.seattle.gov/resource/76t5-zqzr.json",
    date_field: "applieddate",
    order: "applieddate DESC",
    field_map: {
      permit_id: "permitnum",
      address: "originaladdress1",
      city: "originalcity",
      state: "originalstate",
      zip: "originalzip",
      permit_type: "permittypedesc",
      description: "description",
      value: "estprojectcost",
      filed_date: "applieddate",
      issued_date: "issueddate",
      status: "statuscurrent",
      latitude: "latitude",
      longitude: "longitude",
    },
  },

  // ── Ohio ─────────────────────────────────────────
  {
    id: "cincinnati_oh",
    name: "Cincinnati OH Permits",
    region: "Cincinnati",
    state: "OH",
    endpoint: "https://data.cincinnati-oh.gov/resource/uhjb-xac9.json",
    date_field: "issueddate",
    order: "issueddate DESC",
    field_map: {
      permit_id: "permitnum",
      address: "originaladdress1",
      city: "originalcity",
      state: "originalstate",
      permit_type: "permittypemapped",
      description: "description",
      value: "estprojectcost",
      filed_date: "applieddate",
      issued_date: "issueddate",
      status: "statuscurrentmapped",
    },
  },

  // ── Louisiana ────────────────────────────────────
  {
    id: "baton_rouge_la",
    name: "Baton Rouge LA Permits",
    region: "Baton Rouge",
    state: "LA",
    endpoint: "https://data.brla.gov/resource/7fq7-8j7r.json",
    date_field: "issueddate",
    order: "issueddate DESC",
    field_map: {
      permit_id: "permitnumber",
      address: "streetaddress",
      city: "city1",
      permit_type: "permittype",
      description: "projectdescription",
      applicant: "ownername",
      value: "projectvalue",
      filed_date: "creationdate",
      issued_date: "issueddate",
      status: "status",
    },
  },

  // ── Maryland ─────────────────────────────────────
  {
    id: "montgomery_md",
    name: "Montgomery County MD Permits",
    region: "Montgomery County",
    state: "MD",
    endpoint: "https://data.montgomerycountymd.gov/resource/qxie-8qnp.json",
    date_field: "issueddate",
    order: "issueddate DESC",
    field_map: {
      permit_id: "permitno",
      address: "stno",  // combined in normalizer
      city: "city",
      state: "state",
      zip: "zip",
      permit_type: "applicationtype",
      description: "description",
      value: "estimatedcost",
      filed_date: "addeddate",
      issued_date: "issueddate",
      status: "status",
    },
  },
];

export default SOURCES;
