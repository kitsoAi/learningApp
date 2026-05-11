import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "";
const parsedApiUrl = (() => {
  try {
    return new URL(apiUrl);
  } catch {
    return null;
  }
})();

const parsedSupabaseUrl = (() => {
  try {
    return supabaseUrl ? new URL(supabaseUrl) : null;
  } catch {
    return null;
  }
})();

const uploadRemotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "http",
    hostname: "localhost",
    port: "8000",
    pathname: "/uploads/**",
  },
];

if (parsedApiUrl && (parsedApiUrl.protocol === "http:" || parsedApiUrl.protocol === "https:")) {
  const configuredProtocol = parsedApiUrl.protocol.slice(0, -1) as "http" | "https";
  const configuredPort = parsedApiUrl.port || "";
  const alreadyIncluded = uploadRemotePatterns.some(
    (pattern) =>
      pattern.protocol === configuredProtocol &&
      pattern.hostname === parsedApiUrl.hostname &&
      pattern.port === configuredPort
  );

  if (!alreadyIncluded) {
    uploadRemotePatterns.push({
      protocol: configuredProtocol,
      hostname: parsedApiUrl.hostname,
      port: configuredPort,
      pathname: "/uploads/**",
    });
  }
}

if (
  parsedSupabaseUrl &&
  (parsedSupabaseUrl.protocol === "http:" || parsedSupabaseUrl.protocol === "https:")
) {
  uploadRemotePatterns.push({
    protocol: parsedSupabaseUrl.protocol.slice(0, -1) as "http" | "https",
    hostname: parsedSupabaseUrl.hostname,
    port: parsedSupabaseUrl.port || "",
    pathname: "/storage/v1/object/public/**",
  });
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: uploadRemotePatterns,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
