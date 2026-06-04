import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminPath } from "@/lib/admin-path";
import {
  assertNotLocked,
  clearLoginLockout,
  normalizeLoginEmail,
  recordFailedLogin,
} from "@/lib/login-lockout";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = normalizeLoginEmail(String(body.email ?? ""));
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Correo y contrasena son obligatorios." }, { status: 400 });
    }

    const lockCheck = await assertNotLocked(email);
    if (!lockCheck.ok) {
      return NextResponse.json({ error: lockCheck.message, locked: true }, { status: 423 });
    }

    const cookieStore = cookies();
    let response = NextResponse.json({ ok: true, redirectTo: adminPath() });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      await recordFailedLogin(email);
      const afterLock = await assertNotLocked(email);
      const message = afterLock.ok
        ? "Correo o contrasena incorrectos."
        : afterLock.message;
      return NextResponse.json(
        { error: message, locked: !afterLock.ok },
        { status: afterLock.ok ? 401 : 423 },
      );
    }

    await clearLoginLockout(email);
    return response;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al iniciar sesion";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
