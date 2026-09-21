const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.expo') {
        processDir(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file === 'App.tsx') {
      let content = fs.readFileSync(fullPath, 'utf8');
      const updated = content.replace(/(from\s+['\"])(\.[^'"]*)\.js(['"])/g, '$1$2$3')
                             .replace(/(export\s+\*\s+from\s+['\"])(\.[^'"]*)\.js(['"])/g, '$1$2$3');
      if (content !== updated) {
        fs.writeFileSync(fullPath, updated, 'utf8');
        console.log('Fixed imports in:', path.relative(process.cwd(), fullPath));
      }
    }
  }
}

processDir(path.join(__dirname, 'mobile'));
console.log('Done fixing imports.');
