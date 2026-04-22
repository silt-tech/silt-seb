import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import {
  getPlan,
  serializeEntitlements,
  USER_ENTITLEMENTS_KEY,
  NO_ENTITLEMENTS,
  type Entitlements,
} from "@/lib/stripe";

/**
 * POST /api/stripe/backfill-entitlements?secret=seb-stripe-backfill-2026
 *
 * One-time migration: reads every seb:stripe:subscription:{username} record
 * and populates seb:user-entitlements from the stored planId. Safe to re-run —
 * it's a full rewrite of the hash based on current subscription state.
 *
 * A subscription in "cancelled" status gets NO_ENTITLEMENTS.
 */
const BACKFILL_SECRET = "seb-stripe-backfill-2026";

interface Report {
  scanned: number;
  backfilled: number;
  skipped: Array<{ key: string; reason: string }>;
  users: Array<{ username: string; planId: string; status: string; entitlements: Entitlements }>;
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("secret") !== BACKFILL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const redis = getRedis();
  const report: Report = { scanned: 0, backfilled: 0, skipped: [], users: [] };

  // SCAN every subscription key
  let cursor: string | number = 0;
  const keys: string[] = [];
  do {
    const [next, batch] = await redis.scan(cursor, {
      match: "seb:stripe:subscription:*",
      count: 100,
    });
    keys.push(...batch);
    cursor = next;
  } while (cursor !== 0 && cursor !== "0");

  for (const key of keys) {
    report.scanned++;
    const username = key.replace(/^seb:stripe:subscription:/, "");
    if (!username) {
      report.skipped.push({ key, reason: "empty username" });
      continue;
    }

    const stored = await redis.get(key);
    if (!stored) {
      report.skipped.push({ key, reason: "subscription record missing" });
      continue;
    }

    const sub = typeof stored === "string" ? JSON.parse(stored) : stored;
    const planId = (sub as Record<string, string>).planId ?? "";
    const status = (sub as Record<string, string>).status ?? "unknown";

    // Cancelled subs get no entitlements
    if (status === "cancelled") {
      await redis.hdel(USER_ENTITLEMENTS_KEY, username);
      report.users.push({ username, planId, status, entitlements: { ...NO_ENTITLEMENTS } });
      report.backfilled++;
      continue;
    }

    const plan = getPlan(planId);
    if (!plan) {
      report.skipped.push({ key, reason: `unknown planId: ${planId}` });
      continue;
    }

    await redis.hset(USER_ENTITLEMENTS_KEY, {
      [username]: serializeEntitlements(plan.entitlements),
    });

    report.users.push({
      username,
      planId,
      status,
      entitlements: { ...plan.entitlements },
    });
    report.backfilled++;
  }

  return NextResponse.json(report);
}

/** GET — dry-run: report what WOULD be written without touching Redis. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("secret") !== BACKFILL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const redis = getRedis();
  const report: Report = { scanned: 0, backfilled: 0, skipped: [], users: [] };

  let cursor: string | number = 0;
  const keys: string[] = [];
  do {
    const [next, batch] = await redis.scan(cursor, {
      match: "seb:stripe:subscription:*",
      count: 100,
    });
    keys.push(...batch);
    cursor = next;
  } while (cursor !== 0 && cursor !== "0");

  for (const key of keys) {
    report.scanned++;
    const username = key.replace(/^seb:stripe:subscription:/, "");
    const stored = await redis.get(key);
    if (!stored) {
      report.skipped.push({ key, reason: "subscription record missing" });
      continue;
    }
    const sub = typeof stored === "string" ? JSON.parse(stored) : stored;
    const planId = (sub as Record<string, string>).planId ?? "";
    const status = (sub as Record<string, string>).status ?? "unknown";

    if (status === "cancelled") {
      report.users.push({ username, planId, status, entitlements: { ...NO_ENTITLEMENTS } });
      continue;
    }
    const plan = getPlan(planId);
    if (!plan) {
      report.skipped.push({ key, reason: `unknown planId: ${planId}` });
      continue;
    }
    report.users.push({ username, planId, status, entitlements: { ...plan.entitlements } });
  }

  return NextResponse.json({ dryRun: true, ...report });
}
