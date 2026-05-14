import "server-only";

import fs from "fs/promises";
import path from "path";

import type { MockDb } from "@/lib/db/types";

const DB_PATH = path.join(process.cwd(), "data", "mock-db.json");

export async function readMockDb(): Promise<MockDb> {
  const raw = await fs.readFile(DB_PATH, "utf-8");
  return JSON.parse(raw) as MockDb;
}

export async function writeMockDb(db: MockDb): Promise<void> {
  await fs.writeFile(DB_PATH, `${JSON.stringify(db, null, 2)}\n`, "utf-8");
}
