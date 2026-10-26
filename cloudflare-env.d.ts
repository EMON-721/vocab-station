declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    ADMIN_EMAIL?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    SITE_ORIGIN?: string;
    LEARNING_ENABLED?: string;
    BUCKET?: R2Bucket;
  }
}
