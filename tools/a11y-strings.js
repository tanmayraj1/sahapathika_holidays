/*
 * Translation check for the accessibility toolbar (round 2, Phase 3).
 *
 *   node tools/a11y-strings.js a11y/a11y.js                     list every string the toolbar translates
 *   node tools/a11y-strings.js a11y/a11y.js a11y/lang/ml.json   check a table: missing, unused, placeholders
 *
 * Add a new UI string by wrapping it in tr('…') in a11y.js, then add it to both a11y/lang/ml.json
 * and a11y/lang/hi.json and run this check. Translations should be reviewed by a native speaker.
 */
const t = require('fs').readFileSync(process.argv[2], 'utf8');
const set = new Set();
for (const m of t.matchAll(/tr\(\s*'((?:[^'\\]|\\.)*)'/g)) set.add(m[1]);
for (const m of t.matchAll(/tr\([^()']*\?\s*'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'/g)) { set.add(m[1]); set.add(m[2]); }
const blk = (a, b) => { const i = t.indexOf(a); return t.slice(i, t.indexOf(b, i)); };
for (const m of blk('var LEVELS', '};').matchAll(/'([^']+)'/g)) set.add(m[1]);
for (const m of blk('var PROFILES', '];').matchAll(/label: '([^']+)'/g)) set.add(m[1]);
for (const m of blk('var SECTIONS', '];').matchAll(/(?:title|note|label): '((?:[^'\\]|\\.)*)'/g)) set.add(m[1]);
for (const m of blk('var LANG_NAMES', '};').matchAll(/'([^']+)'/g)) set.add(m[1]);
for (const m of blk("if (t === 'INPUT')", ';').matchAll(/'([a-z ]{4,})'/g)) set.add(m[1]);
for (const m of blk('var count = {', '};').matchAll(/'([^']+)'/g)) set.add(m[1]);
for (const m of blk('var none = {', '};').matchAll(/'([^']+)'/g)) set.add(m[1]);
['Move button left','Move button right','Accessibility button moved right','Accessibility button moved left'].forEach(s => set.add(s));
const out = [...set].filter(s => /[A-Za-z]{2}/.test(s) && !/^(en|hi|ml|headings|landmarks|links)$/.test(s) && !/^\d/.test(s) && !/^[#)]|tabindex|scrollIntoView|behavior|English text/.test(s));
if (process.argv[3]) {
  /* check a translation file covers every string */
  const tr = JSON.parse(require('fs').readFileSync(process.argv[3], 'utf8'));
  const missing = out.filter(s => !(s in tr)), extra = Object.keys(tr).filter(k => !out.includes(k));
  const badVars = out.filter(s => tr[s] && (s.match(/\{\w+\}/g) || []).sort().join() !== (tr[s].match(/\{\w+\}/g) || []).sort().join());
  console.log(JSON.stringify({ total: out.length, missing, extra, badVars }, null, 1));
} else console.log(out.length + '\n' + out.join('\n'));
