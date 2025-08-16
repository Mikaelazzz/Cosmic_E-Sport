/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/src/prestasi/:path*',
        destination: '/api/images/prestasi/:path*'
      }
    ];
  }
};

export default nextConfig;
