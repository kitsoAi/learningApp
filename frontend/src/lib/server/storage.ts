import { put } from "@vercel/blob";

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
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Missing BLOB_READ_WRITE_TOKEN. Create a public Vercel Blob store connected to this project."
    );
  }

  const extension = getExtension(file);
  const safeBaseName = sanitizeName(file.name.replace(/\.[^.]+$/, "")) || "file";
  const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${safeBaseName}${extension}`;

  const blob = await put(path, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type || "application/octet-stream",
  });

  return {
    filename: blob.pathname.split("/").pop() || blob.pathname,
    path: blob.pathname,
    url: blob.url,
  };
}
