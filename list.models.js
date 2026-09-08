const fs = require('fs');

// Fix config.js: update Groq model to working one
let cfg = fs.readFileSync('D:/hyderabad-estate-site/config.js', 'utf8');
cfg = cfg.replace("groqModel: 'llama-3.1-8b-instant'", "groqModel: 'openai/gpt-oss-20b'");
fs.writeFileSync('D:/hyderabad-estate-site/config.js', cfg, 'utf8');
console.log('config.js: groqModel updated to openai/gpt-oss-20b');

// Fix script.js: reorder sendChat to try Groq FIRST (OpenAI key is invalid, avoid wasted retries)
let src = fs.readFileSync('D:/hyderabad-estate-site/script.js', 'utf8');

var oldOrder = [
  '  var cfg = window.AI_CONFIG;',
  '  if (cfg && cfg.openaiKey && cfg.openaiKey.length > 10) {',
  "    reply = await callCloudAI('openai', msg);",
  '  }',
  '  if (!reply && cfg && cfg.groqKey && cfg.groqKey.length > 10) {',
  "    reply = await callCloudAI('groq', msg);",
  '  }'
].join('\n');

var newOrder = [
  '  var cfg = window.AI_CONFIG;',
  '  // Groq first (working key), then OpenAI, then local engine',
  '  if (cfg && cfg.groqKey && cfg.groqKey.length > 10) {',
  "    reply = await callCloudAI('groq', msg);",
  '  }',
  '  if (!reply && cfg && cfg.openaiKey && cfg.openaiKey.length > 10) {',
  "    reply = await callCloudAI('openai', msg);",
  '  }'
].join('\n');

if (src.includes(oldOrder)) {
  src = src.replace(oldOrder, newOrder);
  console.log('script.js: sendChat reordered - Groq is now PRIMARY');
} else {
  console.log('script.js: WARNING - sendChat pattern not found!');
  var idx = src.indexOf('async function sendChat');
  console.log('Context: ' + JSON.stringify(src.slice(idx, idx + 600)));
}

fs.writeFileSync('D:/hyderabad-estate-site/script.js', src, 'utf8');

// Syntax check
try {
  require('child_process').execSync('node --check "D:/hyderabad-estate-site/script.js"', {stdio: 'pipe'});
  console.log('Syntax: OK');
} catch(e) {
  console.log('Syntax ERROR: ' + e.stderr.toString().slice(0, 400));
}
