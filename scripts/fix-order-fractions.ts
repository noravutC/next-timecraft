/**
 * One-shot data migration: regenerate any orderFraction values that are not
 * canonical fractional-indexing keys.
 *
 * Run:
 *   DATABASE_URL=... pnpm dlx tsx scripts/fix-order-fractions.ts
 */

import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { generateNKeysBetween, generateKeyBetween } from "fractional-indexing";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";
import {
  columnsTable,
  subtasksTable,
  tasksTable,
} from "../src/db/schema";

const isValidKey = (value: string | null | undefined): boolean => {
  if (!value) return false;
  try {
    generateKeyBetween(value, null);
    return true;
  } catch {
    return false;
  }
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

type Row = { id: string; orderFraction: string };

async function fixGroup<T extends Row>(
  rows: T[],
  groupKey: (row: T) => string,
  applyUpdate: (id: string, newKey: string) => Promise<unknown>,
): Promise<{ scanned: number; fixed: number; groupsTouched: number }> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const k = groupKey(row);
    const arr = groups.get(k) ?? [];
    arr.push(row);
    groups.set(k, arr);
  }

  let fixed = 0;
  let groupsTouched = 0;

  for (const [, items] of groups) {
    const anyInvalid = items.some((it) => !isValidKey(it.orderFraction));
    if (!anyInvalid) continue;

    items.sort((a, b) =>
      a.orderFraction < b.orderFraction
        ? -1
        : a.orderFraction > b.orderFraction
          ? 1
          : 0,
    );

    const newKeys = generateNKeysBetween(null, null, items.length);
    groupsTouched += 1;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const next = newKeys[i];
      if (it.orderFraction !== next) {
        await applyUpdate(it.id, next);
        fixed += 1;
      }
    }
  }

  return { scanned: rows.length, fixed, groupsTouched };
}

async function main() {
  console.log("Scanning tasks…");
  const tasks = await db
    .select({
      id: tasksTable.id,
      orderFraction: tasksTable.orderFraction,
      columnId: tasksTable.columnId,
    })
    .from(tasksTable);
  const taskStats = await fixGroup(
    tasks,
    (t) => t.columnId,
    (id, key) =>
      db
        .update(tasksTable)
        .set({ orderFraction: key })
        .where(eq(tasksTable.id, id)),
  );
  console.log("  tasks:", taskStats);

  console.log("Scanning columns…");
  const columns = await db
    .select({
      id: columnsTable.id,
      orderFraction: columnsTable.orderFraction,
      projectId: columnsTable.projectId,
    })
    .from(columnsTable);
  const columnStats = await fixGroup(
    columns,
    (c) => c.projectId,
    (id, key) =>
      db
        .update(columnsTable)
        .set({ orderFraction: key })
        .where(eq(columnsTable.id, id)),
  );
  console.log("  columns:", columnStats);

  console.log("Scanning subtasks…");
  const subtasks = await db
    .select({
      id: subtasksTable.id,
      orderFraction: subtasksTable.orderFraction,
      taskId: subtasksTable.taskId,
    })
    .from(subtasksTable);
  const subtaskStats = await fixGroup(
    subtasks,
    (s) => s.taskId,
    (id, key) =>
      db
        .update(subtasksTable)
        .set({ orderFraction: key })
        .where(eq(subtasksTable.id, id)),
  );
  console.log("  subtasks:", subtaskStats);

  await client.end();
  console.log("Done.");
}

main().catch(async (err) => {
  console.error(err);
  await client.end();
  process.exit(1);
});
