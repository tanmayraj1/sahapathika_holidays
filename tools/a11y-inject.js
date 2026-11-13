#!/usr/bin/env node
/*
 * a11y-inject.js — apply accessibility edits to every live page, safely.
 *
 * The site is 33 self-contained HTML files that each carry a full copy of the
 * template + app logic, so one fix = the same edit in every file. This tool
 * holds those edits in tools/a11y-edits.js and applies them all-or-nothing:
 *
 *   - Every edit states how many matches it expects per file. If ANY file
 *     disagrees, nothing is written and the mismatch is reported.
 *   - Every edit is idempotent: once its `applied` marker is in a file, the
 *     edit is skipped for that file, so the tool can be re-run at any time.
 *   - Dry run is the default. Nothing is written without --write.
 *   - Line endings are preserved (the repo checks out as CRLF on Windows).
 *
 * Usage (run from the repo root or anywhere):
 *   node tools/a11y-inject.js                 # dry run: report what would change
 *   node tools/a11y-inject.js --write         # apply
 *   node tools/a11y-inject.js --only=skip-link,focus-ring
 *   node tools/a11y-inject.js --files=index.html,contact.html
 *   node tools/a11y-inject.js --list          # list pages and edits, then exit
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/* Pages that are not part of the live site (robots.txt disallows them). */
const NOT_LIVE = new Set(['debug.html', 'old_packages.html']);

function parseArgs(argv) {
  const out = { write: false, list: false, only: null, files: null };
  for (const a of argv) {
    if (a === '--write') out.write = true;
    else if (a === '--list') out.list = true;
    else if (a.startsWith('--only=')) out.only = new Set(a.slice(7).split(',').filter(Boolean));
    else if (a.startsWith('--files=')) out.files = new Set(a.slice(8).split(',').filter(Boolean));
    else if (a === '--help' || a === '-h') { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]); process.exit(0); }
    else { console.error('Unknown argument: ' + a); process.exit(2); }
  }
  return out;
}

/* Every live page, tagged as 'full' (carries the app) or 'stub' (legal placeholder). */
function livePages() {
  return fs.readdirSync(ROOT)
    .filter(f => f.endsWith('.html') && !NOT_LIVE.has(f))
    .sort()
    .map(f => {
      const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
      return { file: f, kind: text.includes('data-dc-script') ? 'full' : 'stub' };
    });
}

function appliesTo(edit, page) {
  const t = edit.appliesTo || 'full';
  if (typeof t === 'function') return t(page.file, page.kind);
  if (t === 'all') return true;
  if (Array.isArray(t)) return t.includes(page.file);
  return t === page.kind;
}

/* Turn '\n' in an edit's strings into the file's own line ending. */
function eolify(value, eol) {
  return typeof value === 'string' && eol !== '\n' ? value.replace(/\r?\n/g, eol) : value;
}

function countMatches(text, find) {
  if (typeof find === 'string') {
    if (!find) return 0;
    let n = 0, i = 0;
    while ((i = text.indexOf(find, i)) !== -1) { n++; i += find.length; }
    return n;
  }
  const re = new RegExp(find.source, find.flags.includes('g') ? find.flags : find.flags + 'g');
  return (text.match(re) || []).length;
}

function replaceAll(text, find, replace) {
  if (typeof find === 'string') return text.split(find).join(typeof replace === 'function' ? replace(find) : replace);
  const re = new RegExp(find.source, find.flags.includes('g') ? find.flags : find.flags + 'g');
  return text.replace(re, replace);
}

/* expect: a number, or { min, max }. */
function expectOk(expect, n) {
  if (expect == null) return n > 0;
  if (typeof expect === 'number') return n === expect;
  return n >= (expect.min ?? 0) && n <= (expect.max ?? Infinity);
}
function expectText(expect) {
  if (expect == null) return '>=1';
  if (typeof expect === 'number') return String(expect);
  return (expect.min ?? 0) + '..' + (expect.max ?? '∞');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const edits = require('./a11y-edits.js').filter(e => !args.only || args.only.has(e.id));
  let pages = livePages();
  if (args.files) pages = pages.filter(p => args.files.has(p.file));

  if (args.list) {
    console.log('Live pages (' + pages.length + '):');
    pages.forEach(p => console.log('  ' + p.kind.padEnd(5) + ' ' + p.file));
    console.log('\nEdits (' + edits.length + '):');
    edits.forEach(e => console.log('  ' + e.id.padEnd(28) + ' ' + (e.description || '')));
    return;
  }

  if (args.only) {
    const known = new Set(require('./a11y-edits.js').map(e => e.id));
    const unknown = [...args.only].filter(id => !known.has(id));
    if (unknown.length) { console.error('Unknown edit id(s): ' + unknown.join(', ')); process.exit(2); }
  }

  const problems = [];
  const results = []; // { file, before, after, log[] }

  /* Guard: an edit's "already applied" marker must not appear in another edit's replacement
     for the same page, or that edit would be silently skipped once the other one runs. */
  const markerOf = e => e.applied !== undefined ? e.applied : (typeof e.replace === 'string' ? e.replace : null);
  for (const page of pages) {
    const here = edits.filter(e => appliesTo(e, page));
    for (const a of here) {
      const m = markerOf(a);
      if (!m) continue;
      for (const b of here) {
        /* markerFrom: an edit may deliberately key its "done" state off another edit's output */
        if (a !== b && a.markerFrom !== b.id && typeof b.replace === 'string' && b.replace.includes(m)) {
          problems.push(page.file + ': marker of "' + a.id + '" also appears in "' + b.id + '" — give "' + a.id + '" a unique `applied`');
        }
      }
    }
  }

  for (const page of pages) {
    const full = path.join(ROOT, page.file);
    const before = fs.readFileSync(full, 'utf8');
    const eol = before.includes('\r\n') ? '\r\n' : '\n';
    let text = before;
    const log = [];

    for (const edit of edits) {
      if (!appliesTo(edit, page)) continue;
      const find = eolify(edit.find, eol);
      const replace = eolify(edit.replace, eol);
      const marker = eolify(edit.applied !== undefined ? edit.applied : (typeof edit.replace === 'string' ? edit.replace : null), eol);

      if (marker && text.includes(marker)) { log.push('  = ' + edit.id + ' (already applied)'); continue; }

      const n = countMatches(text, find);
      const expect = typeof edit.expect === 'function' ? edit.expect(page.file, page.kind) : edit.expect;
      if (!expectOk(expect, n)) {
        problems.push(page.file + ': ' + edit.id + ' matched ' + n + ', expected ' + expectText(expect));
        log.push('  ! ' + edit.id + ' matched ' + n + ', expected ' + expectText(expect));
        continue;
      }
      if (n === 0) { log.push('  - ' + edit.id + ' (0 matches, allowed)'); continue; }
      text = replaceAll(text, find, replace);
      log.push('  + ' + edit.id + ' x' + n);
    }
    /* Guard: an edit must never mix line endings (e.g. a regex leaving '\r\r\n' behind) */
    const badEol = s => (s.match(/\r\r\n/g) || []).length + (eol === '\r\n' ? (s.match(/(^|[^\r])\n/g) || []).length : 0);
    if (badEol(text) > badEol(before)) {
      problems.push(page.file + ': edits would leave mixed line endings');
      log.push('  ! mixed line endings introduced');
    }
    results.push({ file: page.file, full, before, after: text, log });
  }

  for (const r of results) {
    const changed = r.before !== r.after;
    console.log((changed ? '* ' : '  ') + r.file);
    r.log.forEach(l => console.log(l));
  }

  const changedFiles = results.filter(r => r.before !== r.after);
  console.log('\n' + pages.length + ' pages checked, ' + edits.length + ' edits, ' + changedFiles.length + ' files would change.');

  if (problems.length) {
    console.error('\nNOTHING WRITTEN — ' + problems.length + ' mismatch(es):');
    problems.forEach(p => console.error('  ' + p));
    process.exit(1);
  }
  if (!args.write) {
    console.log('Dry run. Re-run with --write to apply.');
    return;
  }
  changedFiles.forEach(r => fs.writeFileSync(r.full, r.after, 'utf8'));
  console.log('Wrote ' + changedFiles.length + ' files.');
}

main();
