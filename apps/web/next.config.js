//@ts-check
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js options go here
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js
  transpilePackages: ['ui', 'anime-data-access', 'shared-types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 's4.anilist.co' },
      { protocol: 'https', hostname: 'img.anili.st' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
};

module.exports = withSentryConfig(nextConfig, { silent: true });
