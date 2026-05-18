import { NextResponse } from "next/server";
import { getSessionRole, isAdminRole } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/admin";

const BUCKET_IDS = ["copantl_assets", "cava-assets"] as const;
const SETTINGS_LOGO_FIELDS = new Set(["logo_url", "logo_url_2", "logo_url_3"]);

function sanitizeFileName(name: string) {
  const trimmed = name.trim() || "imagen.png";
  return trimmed.replace(/[^\w.\-()]/g, "_").replace(/_+/g, "_");
}

async function ensureBucket(svc: ReturnType<typeof createServiceClient>, bucketId: string) {
  const { data: buckets, error: listError } = await svc.storage.listBuckets();
  if (listError) return listError.message;
  if (buckets?.some((b) => b.id === bucketId)) return null;

  const { error: createError } = await svc.storage.createBucket(bucketId, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"],
  });
  return createError?.message ?? null;
}

export async function POST(req: Request) {
  const session = await getSessionRole();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "No autorizado. Inicia sesión como administrador." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const file = formData.get("file");
  const folder = String(formData.get("folder") ?? "uploads").replace(/^\/+|\/+$/g, "");
  const settingsField = formData.get("settingsField");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Selecciona un archivo de imagen." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Solo se permiten imágenes (PNG, JPG, WebP, GIF)." }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "La imagen no puede superar 10 MB." }, { status: 400 });
  }

  let svc: ReturnType<typeof createServiceClient>;
  try {
    svc = createServiceClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Configuración del servidor incompleta";
    return NextResponse.json(
      { error: `${msg}. Agrega SUPABASE_SERVICE_ROLE_KEY en .env.local y reinicia el servidor.` },
      { status: 500 },
    );
  }

  const filePath = `${folder}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "image/png";

  let bucketUsed: string | null = null;
  let lastError = "No se pudo subir la imagen.";

  for (const bucketId of BUCKET_IDS) {
    await ensureBucket(svc, bucketId);
    const { error } = await svc.storage.from(bucketId).upload(filePath, buffer, {
      contentType,
      upsert: true,
    });
    if (!error) {
      bucketUsed = bucketId;
      break;
    }
    lastError = error.message;
  }

  if (!bucketUsed) {
    return NextResponse.json({ error: lastError }, { status: 500 });
  }

  const { data: urlData } = svc.storage.from(bucketUsed).getPublicUrl(filePath);
  const publicUrl = urlData.publicUrl;

  if (settingsField !== null && settingsField !== undefined && String(settingsField) !== "") {
    const field = String(settingsField);
    if (!SETTINGS_LOGO_FIELDS.has(field)) {
      return NextResponse.json({ error: "Campo de configuración no válido." }, { status: 400 });
    }

    const { error: dbError } = await svc.from("site_settings").update({ [field]: publicUrl }).eq("id", 1);
    if (dbError) {
      return NextResponse.json(
        {
          error: `La imagen se subió, pero no se guardó en el sitio: ${dbError.message}. Ejecuta en Supabase: alter table public.site_settings add column if not exists logo_url_2 text; alter table public.site_settings add column if not exists logo_url_3 text;`,
          publicUrl,
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ publicUrl, bucket: bucketUsed, path: filePath });
}
