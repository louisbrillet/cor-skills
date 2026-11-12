#!/usr/bin/env node
// Generates a version-aware map of official dependency documentation.
// Usage: node gen-dependency-docs.mjs [path/to/package.json] [--out docs/DEPENDENCIES.md]

import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const packageArgument = args.find((argument) => !argument.startsWith('--')) ?? 'package.json';
const packagePath = path.resolve(packageArgument);
const outputIndex = args.indexOf('--out');
const outputPath = path.resolve(outputIndex === -1 ? 'docs/DEPENDENCIES.md' : args[outputIndex + 1]);
const timeoutMs = 8000;
const concurrency = 8;

// Packages whose npm homepage does not point to their official docs site.
const overrides = {
  prisma: 'https://www.prisma.io/docs',
  '@prisma/client': 'https://www.prisma.io/docs',
};

const networkErrors = new Set();
const projectRoot = path.dirname(packagePath);

async function readJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

async function observedVersion(name, declaredRange) {
  const installed = await readJson(path.join(projectRoot, 'node_modules', ...name.split('/'), 'package.json'));
  if (installed?.version) return { value: installed.version, source: 'node_modules' };

  for (const lockName of ['package-lock.json', 'npm-shrinkwrap.json']) {
    const lockfile = await readJson(path.join(projectRoot, lockName));
    const packageEntry = lockfile?.packages?.[`node_modules/${name}`];
    if (packageEntry?.version) return { value: packageEntry.version, source: lockName };
    const legacyEntry = lockfile?.dependencies?.[name];
    if (legacyEntry?.version) return { value: legacyEntry.version, source: lockName };
  }

  return { value: declaredRange, source: 'package.json range' };
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { redirect: 'follow', signal: controller.signal });
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') ?? '';
    const body = await response.text();
    if (contentType.includes('text/html') || /^\s*<(!doctype|html)/i.test(body) || body.trim().length < 50) {
      return null;
    }
    return { url: response.url, bytes: body.length };
  } catch (error) {
    if (error?.name !== 'AbortError') networkErrors.add(new URL(url).hostname);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function registryMetadata(name) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!response.ok) return {};
    const metadata = await response.json();
    let repository = typeof metadata.repository === 'string' ? metadata.repository : metadata.repository?.url;
    if (repository) {
      repository = repository
        .replace(/^git\+/, '')
        .replace(/\.git$/, '')
        .replace(/^git:\/\//, 'https://');
    }
    return { homepage: metadata.homepage, repository };
  } catch {
    return {};
  } finally {
    clearTimeout(timeout);
  }
}

function llmsCandidates(homepage) {
  if (!homepage) return [];
  try {
    const url = new URL(homepage);
    if (url.hostname === 'github.com') return [];
    const segments = url.pathname.split('/').filter(Boolean);
    const candidates = new Set([`${url.origin}/llms.txt`]);
    for (let index = segments.length; index > 0; index -= 1) {
      candidates.add(`${url.origin}/${segments.slice(0, index).join('/')}/llms.txt`);
    }
    return [...candidates];
  } catch {
    return [];
  }
}

async function resolveDependency(name, declaredRange) {
  const [version, metadata] = await Promise.all([observedVersion(name, declaredRange), registryMetadata(name)]);
  const homepage = overrides[name] ?? metadata.homepage;
  const entry = { name, version, homepage: homepage ?? null, repository: metadata.repository ?? null, llms: null, llmsFull: null };

  for (const candidate of llmsCandidates(homepage)) {
    const index = await fetchText(candidate);
    if (!index) continue;
    entry.llms = index.url;
    const full = await fetchText(candidate.replace(/llms\.txt$/, 'llms-full.txt'));
    if (full) entry.llmsFull = full;
    break;
  }
  return entry;
}

async function mapWithConcurrency(items, worker) {
  const results = new Array(items.length);
  let index = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (index < items.length) {
        const current = index++;
        results[current] = await worker(items[current]);
      }
    })
  );
  return results;
}

const manifest = await readJson(packagePath);
if (!manifest) {
  console.error(`Cannot read package manifest: ${packagePath}`);
  process.exit(1);
}

const dependencies = Object.entries({ ...(manifest.dependencies ?? {}), ...(manifest.devDependencies ?? {}) }).sort(([left], [right]) => left.localeCompare(right));
if (dependencies.length === 0) {
  console.error(`No dependencies found in ${packagePath}`);
  process.exit(1);
}

process.stderr.write(`Resolving ${dependencies.length} dependencies...\n`);
const entries = await mapWithConcurrency(dependencies, ([name, range]) => resolveDependency(name, range));
const indexedEntries = entries.filter((entry) => entry.llms);
const lines = [
  '# Dependency documentation map',
  '',
  `<!-- GENERATED by .cor/scripts/gen-dependency-docs.mjs on ${new Date().toISOString().slice(0, 10)}. Do not edit by hand. -->`,
  '',
  'Official documentation entry points for this project’s direct dependencies. Before relying on an API example, check the version source below.',
  '',
  `Coverage: ${indexedEntries.length}/${entries.length} dependencies expose an \`llms.txt\` index.`,
  '',
  '| Package | Version observed | Docs entry point (prefer this) | Fallback |',
  '|---|---|---|---|',
];

for (const entry of entries) {
  const primary = entry.llms ? `[llms.txt](${entry.llms})` : entry.homepage ? `[homepage](${entry.homepage})` : '—';
  const fallback = entry.repository ? `[repo](${entry.repository})` : entry.homepage ? `[homepage](${entry.homepage})` : '—';
  lines.push(`| \`${entry.name}\` | ${entry.version.value} (${entry.version.source}) | ${primary} | ${fallback} |`);
}

lines.push(
  '',
  '## Agent guidance',
  '',
  '- Read the `llms.txt` index first, then fetch only documentation pages relevant to the task.',
  '- `llms-full.txt` is optional and often large. Fetch it only when the index cannot answer the question.',
  '- Some sites serve Markdown by appending `.md` to a docs URL. This is a convention, not a guarantee; use the normal page when it fails.',
  '- `node_modules/<package>/README.md`, bundled types, and source describe the installed package. They win if they conflict with online docs.',
  '- `package.json range` means no local resolved version was found. Do not treat it as an installed version.',
  ''
);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, lines.join('\n'), 'utf8');
process.stderr.write(`Wrote ${outputPath} (${indexedEntries.length}/${entries.length} with llms.txt)\n`);
if (networkErrors.size) {
  process.stderr.write(`WARNING: network/TLS errors may undercount coverage. Hosts: ${[...networkErrors].slice(0, 8).join(', ')}\n`);
}
