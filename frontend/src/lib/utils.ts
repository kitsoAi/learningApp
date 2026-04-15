import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const BACKEND_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");

export function formatAssetUrl(path?: string | null) {
  if (!path) return path;
  if (path.startsWith("http")) return path;
  
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  if (cleanPath.startsWith("/uploads/")) {
    return `${BACKEND_URL}${cleanPath}`;
  }
  return path;
}
