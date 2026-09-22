import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    root: path.join(__dirname),
  },
  poweredByHeader: false,
  compress: true,
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "4000", pathname: "/uploads/**" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async rewrites() {
    const api = process.env.API_PROXY_TARGET?.trim() || "http://127.0.0.1:4000";
    return {
      beforeFiles: [
        { source: "/api/v1/:path*", destination: `${api}/api/v1/:path*` },
      ],
      fallback: [
        { source: "/uploads/:path*", destination: `${api}/uploads/:path*` },
      ],
    };
  },
  async redirects() {
    return [
      { source: "/users/hotels", destination: "/hotels", statusCode: 301 },
      { source: "/users/tours", destination: "/tours", statusCode: 301 },
      { source: "/users/tours/:slug", destination: "/tours/:slug", statusCode: 301 },
      { source: "/users/cabs", destination: "/cabs", statusCode: 301 },
      { source: "/users/electrician", destination: "/electrician/hyderabad", statusCode: 301 },
      { source: "/users/electrician/:slug", destination: "/electrician/hyderabad/:slug", statusCode: 301 },
      { source: "/users/plumber", destination: "/plumber/hyderabad", statusCode: 301 },
      { source: "/users/plumber/:slug", destination: "/plumber/hyderabad/:slug", statusCode: 301 },
      { source: "/users/ac", destination: "/ac-repair/hyderabad", statusCode: 301 },
      { source: "/users/ac/:slug", destination: "/ac-repair/hyderabad/:slug", statusCode: 301 },
      { source: "/users/cleaning", destination: "/cleaning/hyderabad", statusCode: 301 },
      { source: "/users/cleaning/:slug", destination: "/cleaning/hyderabad/:slug", statusCode: 301 },
      { source: "/users/beautician", destination: "/beautician/hyderabad", statusCode: 301 },
      { source: "/users/beautician/:slug", destination: "/beautician/hyderabad/:slug", statusCode: 301 },
      { source: "/users/painting", destination: "/painting/hyderabad", statusCode: 301 },
      { source: "/users/painting/:slug", destination: "/painting/hyderabad/:slug", statusCode: 301 },
      { source: "/users/carpenter", destination: "/carpenter/hyderabad", statusCode: 301 },
      { source: "/users/carpenter/:slug", destination: "/carpenter/hyderabad/:slug", statusCode: 301 },
      { source: "/users/appliance", destination: "/appliance/hyderabad", statusCode: 301 },
      { source: "/users/appliance/:slug", destination: "/appliance/hyderabad/:slug", statusCode: 301 },
      { source: "/users/jobs", destination: "/jobs/hyderabad", statusCode: 301 },
      { source: "/users/jobs/:slug", destination: "/jobs/hyderabad/:slug", statusCode: 301 },
      { source: "/users/public-transport", destination: "/public-transport/hyderabad", statusCode: 301 },
      { source: "/users/public-transport/:slug", destination: "/public-transport/hyderabad/:slug", statusCode: 301 },
      { source: "/users/goods-transport", destination: "/goods-transport/hyderabad", statusCode: 301 },
      { source: "/users/goods-transport/:slug", destination: "/goods-transport/hyderabad/:slug", statusCode: 301 },
      { source: "/users/packers-movers", destination: "/packers-movers/hyderabad", statusCode: 301 },
      { source: "/users/packers-movers/:slug", destination: "/packers-movers/hyderabad/:slug", statusCode: 301 },
      { source: "/users/cloud-kitchen", destination: "/cloud-kitchen/hyderabad", statusCode: 301 },
      { source: "/users/cloud-kitchen/:slug", destination: "/cloud-kitchen/hyderabad/:slug", statusCode: 301 },
      { source: "/services", destination: "/home-services", statusCode: 301 },
      { source: "/job-consultancy", destination: "/jobs/hyderabad", statusCode: 301 },
      { source: "/job-consultancy/:slug", destination: "/jobs/hyderabad/:slug", statusCode: 301 },
      { source: "/movers", destination: "/packers-movers/hyderabad", statusCode: 301 },
      { source: "/movers/:slug", destination: "/packers-movers/hyderabad/:slug", statusCode: 301 },
      { source: "/users/movers", destination: "/packers-movers/hyderabad", statusCode: 301 },
      { source: "/users/movers/:slug", destination: "/packers-movers/hyderabad/:slug", statusCode: 301 },
      { source: "/pest-control", destination: "/home-services", statusCode: 301 },
      { source: "/pest-control/:slug", destination: "/home-services", statusCode: 301 },
      { source: "/my-service", destination: "/my-bookings", statusCode: 301 },
      { source: "/my-services", destination: "/my-bookings", statusCode: 301 },
      { source: "/posts", destination: "/vendors/posts", statusCode: 301 },
      { source: "/add-service", destination: "/vendors/services", statusCode: 301 },
      { source: "/add-service/:category", destination: "/vendors/services/:category", statusCode: 301 },
      { source: "/my-orders", destination: "/vendors/my-orders", statusCode: 301 },
    ];
  },
};

export default nextConfig;
