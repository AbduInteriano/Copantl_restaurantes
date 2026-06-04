type UploadOptions = {
  file: File;
  folder: string;
  settingsField?: "logo_url" | "logo_url_2" | "logo_url_3";
};

type UploadResult = {
  publicUrl: string;
  bucket?: string;
  path?: string;
};

export async function uploadAdminImage({ file, folder, settingsField }: UploadOptions): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  if (settingsField) formData.append("settingsField", settingsField);

  const res = await fetch("/api/admin/storage/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const data = (await res.json().catch(() => ({}))) as { error?: string; publicUrl?: string; bucket?: string; path?: string };

  if (!res.ok || !data.publicUrl) {
    throw new Error(data.error ?? "No se pudo subir la imagen.");
  }

  return { publicUrl: data.publicUrl, bucket: data.bucket, path: data.path };
}
