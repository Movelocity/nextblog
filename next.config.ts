import type { NextConfig } from "next";
import { codeInspectorPlugin } from 'code-inspector-plugin';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    turbo: {
      rules: codeInspectorPlugin({
        bundler: 'turbopack',
      }),
    },
  },
}


export default nextConfig;
