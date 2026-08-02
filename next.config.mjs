/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ibb.co' },
      { protocol: 'https', hostname: 'ibb.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  // Next.js 15+: mark google-spreadsheet and google-auth-library as server-only
  serverExternalPackages: [
    'google-spreadsheet',
    'google-auth-library',
  ],
};

export default nextConfig;
