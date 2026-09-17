import { BASE_PATH } from './src/lib/basePath.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The deployed subpath (currently /lax-stats) — Next.js needs this
  // explicitly, or it won't match incoming requests correctly (causing
  // 404s) and won't generate correct links/asset URLs. Single source of
  // truth lives in src/lib/basePath.js so client-side fetch() calls can
  // share it.
  basePath: BASE_PATH,
  // Traces the minimal set of files actually needed at runtime into
  // .next/standalone, instead of requiring the full node_modules folder
  // (~500MB) to be present on the server. This avoids ever needing to
  // run `npm install` on the tightly resource-limited hosting account.
  output: 'standalone',
};

export default nextConfig;
