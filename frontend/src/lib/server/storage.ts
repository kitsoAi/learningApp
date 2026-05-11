import { randomUUID } from "crypto";

function getStorageConfig() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "app-assets";

  if (!supabaseUrl) {
    throw new Error(
      "Missing Supabase URL. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL."
    );
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY.");
  }

  return { bucket, serviceRoleKey, supabaseUrl: supabaseUrl.replace(/\/$/, "") };
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function getExtension(file: File) {
  const name = file.name || "upload.bin";
  const parts = name.split(".");
  return parts.length > 1 ? `.${sanitizeName(parts.pop() || "bin")}` : "";
}

export async function uploadPublicFile(
  file: File,
  folder: "admin" | "avatars"
) {
  const { bucket, serviceRoleKey, supabaseUrl } = getStorageConfig();
  const extension = getExtension(file);
  const safeBaseName = sanitizeName(file.name.replace(/\.[^.]+$/, "")) || "file";
  const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${safeBaseName}-${randomUUID()}${extension}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "content-type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: Buffer.from(await file.arrayBuffer()),
  });

  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text();
    throw new Error(`Supabase upload failed: ${detail}`);
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  return {
    filename: path.split("/").pop() || path,
    path,
    url: publicUrl,
  };
}
