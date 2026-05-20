import { createServiceClient } from "@/lib/supabase/admin";

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 30;

export type LoginLockoutRow = {
  email: string;
  failed_attempts: number;
  locked_until: string | null;
  updated_at: string;
};

export function normalizeLoginEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getLoginLockout(email: string): Promise<LoginLockoutRow | null> {
  const svc = createServiceClient();
  const normalized = normalizeLoginEmail(email);
  const { data, error } = await svc
    .from("admin_login_lockouts")
    .select("email, failed_attempts, locked_until, updated_at")
    .eq("email", normalized)
    .maybeSingle();

  if (error || !data) return null;
  return data as LoginLockoutRow;
}

export function isCurrentlyLocked(row: LoginLockoutRow | null): {
  locked: boolean;
  lockedUntil: Date | null;
  minutesLeft: number;
} {
  if (!row?.locked_until) {
    return { locked: false, lockedUntil: null, minutesLeft: 0 };
  }
  const until = new Date(row.locked_until);
  if (until.getTime() <= Date.now()) {
    return { locked: false, lockedUntil: null, minutesLeft: 0 };
  }
  const minutesLeft = Math.ceil((until.getTime() - Date.now()) / 60_000);
  return { locked: true, lockedUntil: until, minutesLeft };
}

export async function assertNotLocked(email: string): Promise<
  | { ok: true }
  | { ok: false; message: string; minutesLeft: number }
> {
  const row = await getLoginLockout(email);
  const status = isCurrentlyLocked(row);
  if (!status.locked) return { ok: true };
  return {
    ok: false,
    message: `Cuenta bloqueada por intentos fallidos. Intenta de nuevo en ${status.minutesLeft} minuto(s) o contacta a un administrador.`,
    minutesLeft: status.minutesLeft,
  };
}

export async function recordFailedLogin(email: string): Promise<void> {
  const svc = createServiceClient();
  const normalized = normalizeLoginEmail(email);
  const existing = await getLoginLockout(normalized);
  const attempts = (existing?.failed_attempts ?? 0) + 1;
  const locked =
    attempts >= MAX_LOGIN_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()
      : null;

  await svc.from("admin_login_lockouts").upsert(
    {
      email: normalized,
      failed_attempts: attempts,
      locked_until: locked,
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: "email" },
  );
}

export async function clearLoginLockout(email: string): Promise<void> {
  const svc = createServiceClient();
  const normalized = normalizeLoginEmail(email);
  await svc.from("admin_login_lockouts").delete().eq("email", normalized);
}

export async function adminUnlockLogin(email: string): Promise<void> {
  await clearLoginLockout(email);
}

export async function getLockoutsByEmails(
  emails: string[],
): Promise<Map<string, LoginLockoutRow>> {
  const svc = createServiceClient();
  const normalized = emails.map(normalizeLoginEmail).filter(Boolean);
  if (normalized.length === 0) return new Map();

  const { data } = await svc
    .from("admin_login_lockouts")
    .select("email, failed_attempts, locked_until, updated_at")
    .in("email", normalized);

  const map = new Map<string, LoginLockoutRow>();
  for (const row of (data ?? []) as LoginLockoutRow[]) {
    map.set(row.email, row);
  }
  return map;
}
