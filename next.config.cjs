// next.config.cjs
const path = require('path');

module.exports = {
  eslint: { ignoreDuringBuilds: true }, // ← flip to false later
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};
