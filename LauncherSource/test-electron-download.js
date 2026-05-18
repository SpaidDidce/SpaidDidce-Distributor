const { downloadArtifact } = require('@electron/get');
const extract = require('extract-zip');
const fs = require('fs');
const path = require('path');
const { version } = require('electron/package.json');

const platform = process.platform;
const arch = process.arch;

console.log(`Downloading Electron ${version} for ${platform}-${arch}`);

downloadArtifact({
  version,
  artifactName: 'electron',
  force: true,
  platform,
  arch
})
.then(zipPath => {
  console.log('Downloaded to:', zipPath);
  return extract(zipPath, { dir: path.join(__dirname, 'test-dist') });
})
.then(() => {
  console.log('Extracted successfully');
})
.catch(err => {
  console.error('Error:', err);
});
