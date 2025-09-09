import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  images: {
    unoptimized: true,
   
  },
  // During development, expose permissive CORS headers so browser CORS checks
  // don't block requests when using remote backends or different ports.
  // This block runs only when NODE_ENV === 'development' (i.e. `yarn dev`).
  // async headers() {
  //   if (process.env.NODE_ENV === 'development') {
  //     return [
  //       {
  //         source: '/:path*',
  //         headers: [
  //           { key: 'Access-Control-Allow-Origin', value: '*' },
  //           { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
  //           { key: 'Access-Control-Allow-Headers', value: 'X-Requested-With, Content-Type, Authorization, api-key' },
  //         ],
  //       },
  //     ];
  //   }

  //   return [];
  // },
};

export default nextConfig;
