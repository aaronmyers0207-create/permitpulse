import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchSocrataPermits,
  normalizeSocrataPermit,
} from "@/lib/ingest/socrata";

export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET;

interface DataSource {
  name: string;
  endpoint: string;
  county: string;
  config: {
    limit?: number;
    order?: string;
    date_field?: string;
    app_token?: string;
  };
}

const DATA_SOURCES: DataSource[] = [
  {
    name: "Orange County Permits",
    endpoint:
      "https://data.orangecountyfl.net/resource/cq4g-msqp.json",
    county: "Orange",
    config: {
      limit: 1000,
      order: "issue_date DESC",
      date_field: "issue_date",
      app_token: process.env.SOCRATA_APP_TOKEN,
    },
  },
  {
    name: "Osceola County Permits",
    endpoint:
      "https://data.osceola.org/resource/p7iy-krhq.json",
    county: "Osceola",
    config: {
      limit: 1000,
      order: "application_date DESC",
      date_field: "application_date",
      app_token: process.env.SOCRATA_APP_TOKEN,
    },
  },
];

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results: { source: string; fetched: number; upserted: number; errors: number }[] = [];

  for (const source of DATA_SOURCES) {
    const sourceResult = { source: source.name, fetched: 0, upserted: 0, errors: 0 };

    try {
      // Get last pull timestamp for incremental fetching
      const { data: lastLog } = await supabase
        .from("ingestion_logs")
        .select("completed_at")
        .eq("source_name", source.name)
        .eq("status", "success")
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

      const lastPullAt = lastLog?.completed_at ?? null;

      console.log(`[ingest] ${source.name}: fetching since ${lastPullAt ?? "beginning"}`);

      const rawPermits = await fetchSocrataPermits(
        source.endpoint,
        source.config,
        lastPullAt
      );
      sourceResult.fetched = rawPermits.length;

      // Normalize and filter out invalid permits
      const normalized = rawPermits
        .map((raw: any) => normalizeSocrataPermit(raw, source.county))
        .filter((p: any) => p !== null && p.category !== "other");

      // Upsert in batches of 100
      const BATCH_SIZE = 100;
      for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
        const batch = normalized.slice(i, i + BATCH_SIZE);

        const { error } = await supabase
          .from("permits")
          .upsert(batch, { onConflict: "source_permit_id" });

        if (error) {
          console.error(`[ingest] ${source.name}: upsert error`, error.message);
          sourceResult.errors += batch.length;
        } else {
          sourceResult.upserted += batch.length;
        }
      }

      // Log successful ingestion
      await supabase.from("ingestion_logs").insert({
        source_name: source.name,
        status: "success",
        permits_fetched: sourceResult.fetched,
        permits_upserted: sourceResult.upserted,
        completed_at: new Date().toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[ingest] ${source.name}: failed`, message);
      sourceResult.errors = sourceResult.fetched;

      await supabase.from("ingestion_logs").insert({
        source_name: source.name,
        status: "error",
        error_message: message,
        permits_fetched: 0,
        permits_upserted: 0,
        completed_at: new Date().toISOString(),
      });
    }

    results.push(sourceResult);
  }

  const totalUpserted = results.reduce((sum, r) => sum + r.upserted, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

  console.log(`[ingest] complete: ${totalUpserted} upserted, ${totalErrors} errors`);

  return Response.json({
    ok: true,
    timestamp: new Date().toISOString(),
    results,
  });
}
