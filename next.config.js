// next.config.js
const withTM = require('next-transpile-modules')([
  'firebase',
  'undici',
  '@firebase/auth',
]);
const path = require('path');

module.exports = withTM({
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
});
