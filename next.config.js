/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/src/prestasi/:path*',
        destination: '/api/images/prestasi/:path*'
      },
      {
        source: '/src/events/pembayaran/:nim/:filename',
        destination: '/api/payment-proof/:nim/:filename'
      },
      {
        source: '/src/events/:path*',
        destination: '/api/images/events/:path*'
      }
    ];
  }
};

export default nextConfig;
