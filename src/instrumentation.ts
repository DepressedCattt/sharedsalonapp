/**
 * Next.js instrumentation hook — runs once per server instance startup,
 * before any requests are served.
 *
 * Pre-warming the MongoDB connection here means the very first batch of
 * client API calls (listings, conversations, trust profile, etc.) won't
 * race against the connection being established and return 500s.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { connectDB } = await import("./lib/db");
    // Swallow errors — API routes handle their own connection errors.
    await connectDB().catch(() => {});
  }
}
