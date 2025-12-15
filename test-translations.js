const fs = require('fs');
const path = require('path');

console.log('Testing translation files...\n');

const langs = ['en', 'hi', 'kn'];

langs.forEach(lang => {
  const filePath = path.join(__dirname, 'locales', lang, 'translation.json');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    
    console.log(`✓ ${lang.toUpperCase()} translation.json`);
    console.log(`  Size: ${content.length} bytes`);
    console.log(`  Keys: ${Object.keys(json).length}`);
    console.log(`  Sample keys: ${Object.keys(json).slice(0, 3).join(', ')}`);
    console.log(`  Sample translations:`);
    console.log(`    explore: ${json.explore || 'MISSING'}`);
    console.log(`    about: ${json.about || 'MISSING'}`);
    console.log(`    help: ${json.help || 'MISSING'}`);
    console.log();
  } catch (err) {
    console.error(`✗ Error reading ${lang}:`, err.message);
  }
});
