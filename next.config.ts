import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
