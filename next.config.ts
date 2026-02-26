import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
  },
  outputFileTracingIncludes: {
    '/card/[slug]': ['./public/fonts/**/*'],
    '/watch/[token]': ['./public/fonts/**/*'],
  },
  async redirects() {
    return [
      {
        source: '/app',
        destination: 'https://apps.apple.com/us/app/toy-group-video-cards/id6758913044',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
