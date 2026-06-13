#!/usr/bin/env node
/**
 * Seeds ALL SRD content (races, classes, spells, monsters, etc.) into D1.
 * Run once per environment:
 *   node scripts/seed-srd.js --local    # wrangler dev DB
 *   node scripts/seed-srd.js --remote   # production D1
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isRemote = process.argv.includes('--remote');
const flag = isRemote ? '--remote' : '--local';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const now = Date.now();
const CREATOR_ID = '550e8400-e29b-41d4-a716-446655440000';
const dataDir = path.join(__dirname, '../src/content/infrastructure/seeding/data');

// Map filename fragment → AssetTypeValue string
const TYPE_MAP = [
  ['spells',               'spell'],
  ['subclasses',           'subclass'],
  ['subraces',             'subrace'],
  ['races',                'race'],
  ['classes',              'class'],
  ['monsters',             'monster'],
  ['features',             'feature'],
  ['feats',                'feat'],
  ['backgrounds',          'background'],
  ['equipment-categories', 'equipment-category'],
  ['equipment',            'equipment'],
  ['magic-items',          'magic-item'],
  ['conditions',           'condition'],
  ['damage-types',         'damage-type'],
  ['magic-schools',        'magic-school'],
  ['ability-scores',       'ability-score'],
  ['languages',            'language'],
  ['skills',               'skill'],
  ['proficiencies',        'proficiency'],
  ['traits',               'trait'],
  ['weapon-mastery',       'weapon-mastery'],
  ['weapon-properties',    'weapon-property'],
  ['alignments',           'alignment'],
  ['levels',               'level'],
  ['rule-sections',        'rule-section'],
  ['rules',                'rule'],
];

function mapFilename(filename) {
  const lower = filename.toLowerCase();
  for (const [fragment, type] of TYPE_MAP) {
    if (lower.includes(fragment)) return type;
  }
  return null;
}

function getName(item, type) {
  if (item.name) return String(item.name);
  if (type === 'level' && item.level != null && item.class) {
    return `${item.class.name} Level ${item.level}`;
  }
  return String(item.index);
}

const esc = (s) => String(s).replace(/'/g, "''");

// ── Pack definitions ───────────────────────────────────────────────────────────
const PACKS = [
  { slug: 'srd-dnd-5e-2014', name: 'System Reference Document 5.1 (2014)', system: 'dnd-5e-2014' },
  { slug: 'srd-dnd-5e-2024', name: 'Free Rules (2024)',                    system: 'dnd-5e-2024' },
];

// Assign stable IDs per slug so re-runs don't create duplicates
// (INSERT OR IGNORE on slug — D1 keeps the first insert)
const PACK_IDS = Object.fromEntries(PACKS.map(p => [p.slug, uuid()]));

const lines = [];

for (const pack of PACKS) {
  const packId = PACK_IDS[pack.slug];
  lines.push(
    `INSERT OR IGNORE INTO content_packs (id,slug,name,description,version,type,system,creator_id,dependencies,is_active,is_suspended,status,created_at,updated_at) VALUES ('${packId}','${pack.slug}','${esc(pack.name)}','Official SRD content.','1.0.0','srd','${pack.system}','${CREATOR_ID}','[]',1,0,'draft',${now},${now});`,
  );

  const systemDir = path.join(dataDir, pack.system);
  if (!fs.existsSync(systemDir)) continue;

  const files = fs.readdirSync(systemDir).filter(f => f.endsWith('.json')).sort();

  for (const file of files) {
    const type = mapFilename(file);
    if (!type) {
      console.warn(`  Skipping ${file}: no type mapping`);
      continue;
    }

    let items;
    try {
      items = JSON.parse(fs.readFileSync(path.join(systemDir, file), 'utf8'));
    } catch (e) {
      console.warn(`  Skipping ${file}: parse error — ${e.message}`);
      continue;
    }

    if (!Array.isArray(items)) {
      console.warn(`  Skipping ${file}: not an array`);
      continue;
    }

    let seeded = 0;
    for (const item of items) {
      if (!item.index) continue;
      const idx   = String(item.index);
      const name  = getName(item, type);
      const { index, name: _n, ...rest } = item;
      const data  = esc(JSON.stringify(rest));
      lines.push(
        `INSERT OR IGNORE INTO assets (id,pack_id,type,"index",name,data,compatible_with,created_at,updated_at) VALUES ('${uuid()}',(SELECT id FROM content_packs WHERE slug='${pack.slug}'),'${type}','${esc(idx)}','${esc(name)}','${data}','[]',${now},${now});`,
      );
      seeded++;
    }
    console.log(`  ${pack.system} / ${file.padEnd(40)} → ${type.padEnd(20)} (${seeded} items)`);
  }
}

const tmpFile = path.join(__dirname, '_seed-srd-tmp.sql');
fs.writeFileSync(tmpFile, lines.join('\n'), 'utf8');
const sizeMB = (fs.statSync(tmpFile).size / 1024 / 1024).toFixed(2);
console.log(`\nGenerated ${lines.length} SQL statements (${sizeMB} MB) — target: ${isRemote ? 'REMOTE' : 'local'}`);

try {
  execSync(`npx wrangler d1 execute questmasters ${flag} --file "${tmpFile}"`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  console.log('\nSeed complete.');
} finally {
  fs.unlinkSync(tmpFile);
}
