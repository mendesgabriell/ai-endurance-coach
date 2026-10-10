import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { typedRoutes: true },
  // A raiz do domínio é o painel.
  async redirects() {
    return [{ source: "/", destination: "/prumo", permanent: false }];
  },
};

export default nextConfig;
