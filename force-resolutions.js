const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('./package.json'));

// Ensure we have resolutions
if (!packageJson.resolutions) {
  packageJson.resolutions = {};
}

// Force React and React DOM versions
packageJson.resolutions.react = '18.2.0';
packageJson.resolutions['react-dom'] = '18.2.0';

fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2)); 