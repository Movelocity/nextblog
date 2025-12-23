import type { NextConfig } from "next";
import { codeInspectorPlugin } from 'code-inspector-plugin';

const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: isDev ? {
    turbo: {
      rules: codeInspectorPlugin({
        bundler: 'turbopack',
      }),
    },
  } : {},
}

export default nextConfig;
