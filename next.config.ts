import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        if (!process.env.SHTAI_API_URL) return [];
        return [
            {
                source: '/api/backend/:path*',
                destination: `${process.env.SHTAI_API_URL}/:path*`,
            },
        ];
    },
};

export default nextConfig;
