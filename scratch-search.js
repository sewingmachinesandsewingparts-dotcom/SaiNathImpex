const fs = require('fs');
const path = require('path');

function search(dir) {
  if (dir.includes('node_modules') || dir.includes('.next') || dir.includes('.git')) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      search(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.json') || fullPath.endsWith('.md') || fullPath.endsWith('.csv') || fullPath.endsWith('.txt')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('PEG-NP-PG80005')) {
          console.log(fullPath);
        }
      } catch (e) {}
    }
  }
}
search('.');
