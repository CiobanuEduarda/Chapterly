/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      express: false,
      pg: false,
      'pg-pool': false,
    };
    return config;
  },
  serverExternalPackages: ['pg', 'pg-pool'],
  transpilePackages: ['@t3-oss/env-nextjs'],
};

export default config;
