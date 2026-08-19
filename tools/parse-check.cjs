const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

let bad = 0, n = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist') continue;
      walk(p);
    } else if (/\.(jsx|js)$/.test(e.name)) {
      n++;
      try {
        esbuild.transformSync(fs.readFileSync(p, 'utf8'), { loader: e.name.endsWith('jsx') ? 'jsx' : 'js' });
      } catch (err) {
        bad++;
        console.log('FAIL', p, '->', String(err.message).split('\n')[0]);
      }
    }
  }
}
walk('src');
console.log('Parsed ' + n + ' files, ' + bad + ' failed');
process.exit(bad ? 1 : 0);
