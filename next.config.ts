import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Keep only allowlisted project sources available for the owner's ZIP download.
  outputFileTracingIncludes: {
    "/api/deployment/source": [
      "./src/**/*.ts", "./src/**/*.tsx", "./src/**/*.css",
      "./drizzle/**/*.sql", "./drizzle/**/*.json", "./public/**/*",
      "./package.json", "./package-lock.json", "./tsconfig.json",
      "./next.config.ts", "./next-env.d.ts", "./postcss.config.mjs",
      "./eslint.config.mjs", "./drizzle.deploy.config.ts", "./vercel.json",
      "./.env.example", "./.gitignore", "./.vercelignore", "./.nvmrc",
      "./DEPLOYMENT.md",
    ],
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    }];
  },
};

export default nextConfig;
