declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    ADMIN_EMAIL?: string;
    LEARNING_ENABLED?: string;
    BUCKET?: R2Bucket;
  }
}
