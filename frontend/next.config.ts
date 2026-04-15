import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const parsedApiUrl = (() => {
  try {
    return new URL(apiUrl);
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
