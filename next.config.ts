import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-libsql",
    "@libsql/client",
    "libsql",
  ],
  outputFileTracingIncludes: {
    "/admin": ["./public/flowers/**/*"],
  },
};

export default nextConfig;
