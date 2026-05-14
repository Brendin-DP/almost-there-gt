export function getSessionSecretKey(): Uint8Array {
  const raw = process.env.ADMIN_SESSION_SECRET?.trim();
  if (raw && raw.length >= 32) {
    return new TextEncoder().encode(raw);
  }
  if (process.env.NODE_ENV !== "production") {
    return new TextEncoder().encode(
      "dev-insecure-admin-session-secret-change-me"
    );
  }
  throw new Error(
    "ADMIN_SESSION_SECRET must be set to at least 32 characters in production."
  );
}
