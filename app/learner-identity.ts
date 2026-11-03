import { env } from "cloudflare:workers";

/** Existing accounts retain their learner IDs. New accounts receive 9057, 9058, ... */
export async function ensureLearnerIdCounter(): Promise<void> {
  if (!env.DB) throw Error("Database unavailable");
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS learner_id_counter (key TEXT PRIMARY KEY NOT NULL, next_value INTEGER NOT NULL)"
  ).run();
}

export async function getOrCreateLearnerAccount(userId: string, username: string) {
  if (!env.DB) throw Error("Database unavailable");
  let existing = await env.DB.prepare("SELECT student_id, username FROM accounts WHERE id=?")
    .bind(userId).first<{student_id:string;username:string}>();
  if (existing) return existing;
  await ensureLearnerIdCounter();
  for (let attempt = 0; attempt < 12; attempt++) {
    const result = await env.DB.prepare(
      "INSERT INTO learner_id_counter(key,next_value) VALUES('learner',9058) " +
      "ON CONFLICT(key) DO UPDATE SET next_value=next_value+1 " +
      "RETURNING next_value-1 AS learner_id"
    ).first<{learner_id:number}>();
    if (!result || !Number.isInteger(result.learner_id)) throw Error("Learner ID unavailable");
    await env.DB.prepare("INSERT OR IGNORE INTO accounts(id,student_id,username) VALUES(?,?,?)")
      .bind(userId,String(result.learner_id),username).run();
    existing = await env.DB.prepare("SELECT student_id, username FROM accounts WHERE id=?")
      .bind(userId).first<{student_id:string;username:string}>();
    if (existing) return existing;
    const usernameInUse = await env.DB.prepare("SELECT id FROM accounts WHERE username=?")
      .bind(username).first();
    if (usernameInUse) throw Error("That User ID is already taken.");
  }
  throw Error("Could not assign a unique Learner ID.");
}
