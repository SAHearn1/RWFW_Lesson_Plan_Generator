// next.config.js
const path = require('path');

module.exports = {
  // Tell Next.js to run SWC over these npm packages so
  // private fields (and other modern syntax) get compiled.
  transpilePackages: [
    "firebase",
    "undici"
  ],

  webpack(config) {
    // your existing alias…
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};
