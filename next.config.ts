import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://localhost:3000","http://192.168.1.77:3000/"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        port: "",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "static.tvmaze.com",
        port: "",
        pathname: "/**", // Allow all paths
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        port: "",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "img.example.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "example.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "bkimg.cdn.bcebos.com",
        port: "",
        pathname: "/pic/**",
      },

      {
        protocol: "https",
        hostname: "baike.baidu.com",
        port: "",
        pathname: "/pic/**",
      },
      {
        protocol: "https",
        hostname: "otalkoss.oss-cn-beijing.aliyuncs.com",
        port: "",
        pathname: "/otalk/**",
      },
      {protocol: "https", 
        hostname: "sjc1.vultrobjects.com",
        port: "",
        pathname: "/otalk-test/**",
      },
      {
        protocol: "https",
        hostname: "sgp1.vultrobjects.com",
        port: "",
        pathname: "/movie-test/**",
      },
    ],
  },
};

export default nextConfig;
