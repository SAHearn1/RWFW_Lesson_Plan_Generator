// next.config.js
const path = require('path');

/** 
 * Tell Next.js/webpack that imports starting with "@/" 
 * resolve to the src/ folder.
 */
module.exports = {
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};
