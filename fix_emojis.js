const fs = require('fs');
const files = [
  'Tools/DeveloperCenter/public/renderer.js',
  'LauncherSource/public/renderer.js'
];

// UTF-8 strings read from the file itself since the file was saved as UTF-8 with broken characters.
// Actually, reading the file as utf8 will read the literal "âœ•" etc if it was saved that way.
const replacements = {
  'âœ•': '✖',
  'â ³': '⏳',
  'ðŸŽ®': '🎮',
  'â‚¬': '€',
  'ðŸ“‹': '📋',
  'ðŸŒ ': '🌐',
  'âœ“': '✓',
  'ðŸ”Œ': '🔌',
  'ðŸ‘¥': '👥',
  'âœ ï¸ ': '✏️',
  'ðŸ—‘ï¸ ': '🗑️',
  'ðŸ“¦': '📦',
  'ðŸ” ': '🔍',
  'â€”': '—',
  'â–¶': '▶',
  'â¬‡': '⬇'
};

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  for (const [bad, good] of Object.entries(replacements)) {
    content = content.split(bad).join(good);
  }
  
  // Remove single line comments
  content = content.replace(/\/\/.*$/gm, '');
  // Remove block comments
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Collapse multiple empty lines
  content = content.replace(/^\s*[\r\n]/gm, '\n');
  
  fs.writeFileSync(f, content, 'utf8');
  console.log('Fixed', f);
});
