/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/workspace",
        destination: "/chatbot",
        permanent: false,
      },
      {
        source: "/agenet",
        destination: "/agent",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
