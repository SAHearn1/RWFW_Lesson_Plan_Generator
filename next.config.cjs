// next.config.cjs
const path = require("path");

/** @type {import('next').NextConfig} */
module.exports = {
  eslint: { ignoreDuringBuilds: true }, // <-- optional safety
  webpack(config) {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
};
