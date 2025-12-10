import type { NextConfig } from "next";
import { codeInspectorPlugin } from 'code-inspector-plugin';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';
console.log('API_BASE_URL', API_BASE_URL);

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
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: `${API_BASE_URL}/:path*`,
      },
      
    ]
  },
}


export default nextConfig;
