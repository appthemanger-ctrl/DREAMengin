'use strict';

const withTM = require('next-transpile-modules')([]);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Setting this to false allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
  build: {
    // Build options go here
  },
};

module.exports = withTM(nextConfig);