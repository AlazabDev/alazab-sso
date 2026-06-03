const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = ['node_modules', '.next', '.git', 'dist', '.vercel'];
const IGNORE_FILES = ['.DS_Store', '*.log'];

function generateIndex(dir, prefix = '', depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return '';

  const items = fs.readdirSync(dir);
  let output = '';

  items.forEach((item, index) => {
    if (IGNORE_DIRS.includes(item)) return;

    const filePath = path.join(dir, item);
    const stat = fs.statSync(filePath);
    const isLast = index === items.length - 1;
    const connector = isLast ? '└── ' : '├── ';

    output += `${prefix}${connector}${item}\n`;

    if (stat.isDirectory()) {
      const extension = isLast ? '    ' : '│   ';
      output += generateIndex(filePath, prefix + extension, depth + 1, maxDepth);
    }
  });

  return output;
}

const index = generateIndex('./');
fs.writeFileSync('PROJECT_STRUCTURE.txt', index);
console.log('✅ تم توليد الفهرس في PROJECT_STRUCTURE.txt');
