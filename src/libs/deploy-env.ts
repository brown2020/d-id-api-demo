/**
 * Local `next dev` only. Vercel preview and any NODE_ENV=production
 * process are treated as deployed environments.
 */
export function isLocalDevelopment(): boolean {
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV === "development";
  }
  return process.env.NODE_ENV !== "production";
}
