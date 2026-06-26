//@ts-check
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js options go here
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js
  transpilePackages: [
    '@buscanime/ui',
    '@buscanime/anime-data-access',
    '@buscanime/shared-types',
  ],
};

module.exports = withSentryConfig(nextConfig, { silent: true });
