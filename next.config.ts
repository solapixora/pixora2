import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Allow importing README.md shipped inside ffmpeg/ffprobe installer packages
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    });

    // Keep native binaries resolved by Node at runtime on the server
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        '@ffmpeg-installer/ffmpeg',
        '@ffprobe-installer/ffprobe',
      ];
    }

    return config;
  },
};

export default nextConfig;
