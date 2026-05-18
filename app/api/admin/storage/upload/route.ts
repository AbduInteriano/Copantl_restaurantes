import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSessionRole, isAdminRole } from "@/lib/admin-auth";
import { createServiceClient, hasServiceClientConfig } from "@/lib/supabase/admin";
import { describeMissingSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const BUCKET_IDS = ["copantl_assets", "cava-assets"] as const;

function sanitizeFileName(name: string) {
  const trimmed = name.trim() || "imagen.png";
  return trimmed.replace(/[^\w.\-()]/g, "_").replace(/_+/g, "_");
}

async function ensureBucket(svc: SupabaseClient, bucketId: string) {
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

async function uploadToStorage(
  svc: SupabaseClient,
  filePath: string,
  buffer: Buffer,
  contentType: string,
): Promise<{ publicUrl: string; bucket: string } | { error: string }> {
  let lastError = "No se pudo subir la imagen.";

  for (const bucketId of BUCKET_IDS) {
    await ensureBucket(svc, bucketId);
    const { error } = await svc.storage.from(bucketId).upload(filePath, buffer, {
      contentType,
      upsert: true,
    });
    if (!error) {
      const { data: urlData } = svc.storage.from(bucketId).getPublicUrl(filePath);
      return { publicUrl: urlData.publicUrl, bucket: bucketId };
    }
    lastError = error.message;
  }

  return { error: lastError };
}

function getStorageClient(): SupabaseClient | { error: string } {
  if (hasServiceClientConfig()) {
    try {
      return createServiceClient();
    } catch {
      /* fallback abajo */
    }
  }

  try {
    return createClient();
  } catch (e) {
    const hint = describeMissingSupabaseEnv();
    const detail = e instanceof Error ? e.message : "";
    return {
      error: hint || detail || "Configuración de Supabase incompleta en el servidor.",
    };
  }
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

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Selecciona un archivo de imagen." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Solo se permiten imágenes (PNG, JPG, WebP, GIF)." }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "La imagen no puede superar 10 MB." }, { status: 400 });
  }

  const storageClient = getStorageClient();
  if ("error" in storageClient) {
    return NextResponse.json({ error: storageClient.error }, { status: 500 });
  }

  const filePath = `${folder}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "image/png";

  const uploadResult = await uploadToStorage(storageClient, filePath, buffer, contentType);
  if ("error" in uploadResult) {
    return NextResponse.json({ error: uploadResult.error }, { status: 500 });
  }

  return NextResponse.json({
    publicUrl: uploadResult.publicUrl,
    bucket: uploadResult.bucket,
    path: filePath,
  });
}
