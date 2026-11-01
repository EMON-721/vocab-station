declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    GEMINI_API_KEY?: string;
    GEMINI_ENCRYPTION_KEY?: string;
    ADMIN_EMAIL?: string;
    ADMIN_GOOGLE_SUB?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    SITE_ORIGIN?: string;
    LEARNING_ENABLED?: string;
    AI_DAILY_LIMIT?: string;
    BUCKET?: R2Bucket;
  }
}

