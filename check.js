const fs = require('fs');
const s = fs.readFileSync('D:/hyderabad-estate-site/script.js', 'utf8');
const h = fs.readFileSync('D:/hyderabad-estate-site/index.html', 'utf8');
const c = fs.readFileSync('D:/hyderabad-estate-site/style.css', 'utf8');

console.log('API fetches remaining:', (s.match(/fetch\('\//g) || []).length);
console.log('all fetch calls:', JSON.stringify((s.match(/fetch\([^)]*\)/g) || []).slice(0, 12)));

console.log('--- index.html refs ---');
const refs = h.match(/(src|href)="[^"]*"/g) || [];
console.log(JSON.stringify([...new Set(refs)]));

console.log('--- CSS url() refs ---');
console.log(JSON.stringify([...new Set(c.match(/url\([^)]*\)/g) || [])]));

console.log('--- key functions present in script.js ---');
const fns = ['openGate','logout','loadSocieties','loadBrokers','loadListings','loadHousing','renderFeatured','buildRatingTicker','buildShowcase4D','initBg3D','sendChat','generateLocalReply','toggleAmbientMusic','setupAmbientAutoPlay','login','register','showToast','autoSpeakReply','toggleAgentVoice','speakText','toggleVoice','openSection','viewSociety','viewListing','contactBroker','searchListings','applyFilters'];
const missing = [];
for (const f of fns) {
  const found = s.includes('function ' + f) || s.includes('window.' + f + ' =') || s.includes('const ' + f + ' =') || s.includes('let ' + f + ' =');
  if (!found) missing.push(f);
}
console.log('missing functions:', missing.length ? missing : 'NONE');

console.log('--- onclick handlers in HTML vs script.js ---');
const handlers = [...new Set((h.match(/on(?:click|change|input|keypress|keydown|submit)="([a-zA-Z_][a-zA-Z0-9_]*)\(/g) || []).map(m => m.match(/([a-zA-Z_][a-zA-Z0-9_]*)\($/)[1]))];
const missingH = handlers.filter(fn => !s.includes('function ' + fn) && !s.includes(fn + ' =') && !s.includes('window.' + fn));
console.log('handlers used:', handlers.length, '| missing:', missingH.length ? missingH : 'NONE');

console.log('--- data.js sanity ---');
const d = fs.readFileSync('D:/hyderabad-estate-site/data.js', 'utf8');
const m = d.match(/"societies":\[(.*?)\],"brokers"/s);
console.log('has window.DB:', d.startsWith('window.DB ='));
console.log('size KB:', Math.round(d.length / 1024));
