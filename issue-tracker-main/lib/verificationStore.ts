// app/lib/verificationStore.ts
interface VerificationEntry {
  code: string;
  expires: number; // Timestamp for expiration
}

// WARNING: In-memory store. Not for production for real codes!
// Data is lost on server restart and not shared across instances.
// For this demo with a fake code, it's acceptable.
export const verificationCodes: Record<string, VerificationEntry> = {};