const fs = require('fs');
const readme = `# Hyderabad Estate VIP — Static Site

Production-ready static build for GitHub Pages deployment. No backend, no server required — all data is bundled in \`data.js\` and runs fully client-side.

## Files

| File | Purpose |
|------|---------|
| \`index.html\` | Main page (root) |
| \`style.css\` | All styles |
| \`script.js\` | All application logic |
| \`data.js\` | Bundled database (societies, brokers, listings, housing) |
| \`.nojekyll\` | Tells GitHub Pages to skip Jekyll processing |
| \`README.md\` | This file |

## Deploy to GitHub Pages

1. Create a new repository on GitHub (e.g., \`hyderabad-estate\`).
2. Upload **all files in this folder** to the repository root (drag & drop on github.com works, or use git).
3. In the repository, go to **Settings → Pages**.
4. Under "Build and deployment":
   - Source: **Deploy from a branch**
   - Branch: **main** (or \`master\`), Folder: **/ (root)**
5. Click **Save**. Your site goes live in 1-2 minutes at:
   \`\`\`
   https://<your-username>.github.io/<repo-name>/
   \`\`\`

## Notes

- Login/registration works locally via browser localStorage (no server needed).
- Background music streams from Internet Archive (royalty-free).
- 3D globe uses Three.js, maps use Leaflet — both loaded from CDN, no local files needed.
- All 4 sections (Home, Plots, Flats, Housing), AI Agent chat, voice, filters, and map work fully offline from this folder.
`;
fs.writeFileSync('D:/hyderabad-estate-site/README.md', readme, 'utf8');
console.log('README.md created:', fs.statSync('D:/hyderabad-estate-site/README.md').size, 'bytes');

// Static file server for testing
const http = require('http');
const path = require('path');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join('D:/hyderabad-estate-site', p);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(8080, () => console.log('Static test server running on http://localhost:8080'));
