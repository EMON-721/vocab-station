import { env } from "cloudflare:workers";

export const NEXT_LEARNER_ID_SQL =
  "SELECT ?, CAST(COALESCE(MAX(CASE WHEN student_id GLOB '[0-9]*' " +
  "AND student_id NOT GLOB '*[^0-9]*' AND CAST(student_id AS INTEGER)>=9057 " +
  "THEN CAST(student_id AS INTEGER) END),9056)+1 AS TEXT), ? FROM accounts";

/**
 * Uses the existing accounts table: no migration or DDL in the request path.
 * The primary key and student_id unique constraint prevent duplicate IDs.
 */
export async function getOrCreateLearnerAccount(userId: string, username: string) {
  if (!env.DB) throw Error("Database unavailable");
  for (let attempt = 0; attempt < 12; attempt++) {
    const existing = await env.DB.prepare("SELECT student_id, username FROM accounts WHERE id=?")
      .bind(userId).first<{student_id:string;username:string}>();
    if (existing) return existing;
    try {
      await env.DB.prepare(
        "INSERT OR IGNORE INTO accounts(id,student_id,username) " + NEXT_LEARNER_ID_SQL
      ).bind(userId,username).run();
    } catch (error) {
      // A concurrent allocator may have selected the same learner number.
      if (attempt === 11) throw error;
    }
    const created = await env.DB.prepare("SELECT student_id, username FROM accounts WHERE id=?")
      .bind(userId).first<{student_id:string;username:string}>();
    if (created) return created;
    const taken = await env.DB.prepare("SELECT id FROM accounts WHERE username=?")
      .bind(username).first<{id:string}>();
    if (taken) throw Error("That User ID is already taken.");
  }
  throw Error("Unable to allocate a unique Learner ID. Please retry.");
}
