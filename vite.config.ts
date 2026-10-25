import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig, Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Each build gets an ID, baked into the bundle and written to version.json, so a
// running game can spot that a newer deploy is live and offer a reload.
const BUILD_TIME = new Date().toISOString();
const BUILD_ID = process.env.GITHUB_SHA?.slice(0, 12) || `local-${Date.now()}`;
// Player-facing release notes, grouped into updates by the commit that added each
// line (so threads just add lines). version.json carries them too, so an old build
// can show the lines it doesn't have yet.
const CHANGELOG = groupChangelog();

function groupChangelog(): { time: string; items: string[] }[] {
  const items: string[] = JSON.parse(readFileSync('changelog.json', 'utf8')).flatMap((e: { items: string[] }) => e.items);
  const now = BUILD_TIME;
  const commitOf = new Map<string, string>();
  const timeOf = new Map<string, string>();
  try {
    let sha = '';
    for (const line of execSync('git blame --line-porcelain changelog.json', { encoding: 'utf8' }).split('\n')) {
      const head = line.match(/^([0-9a-f]{40}) \d+ \d+/);
      if (head) sha = head[1];
      else if (line.startsWith('committer-time ')) timeOf.set(sha, new Date(Number(line.slice(15)) * 1000).toISOString());
      else if (line.startsWith('\t')) {
        try {
          const text = JSON.parse(line.slice(1).trim().replace(/,$/, ''));
          if (typeof text === 'string' && !commitOf.has(text)) commitOf.set(text, sha);
        } catch { /* not an item line */ }
      }
    }
  } catch { /* no git history: everything is one update */ }
  const groups = new Map<string, { time: string; items: string[] }>();
  for (const item of items) {
    const sha = commitOf.get(item) ?? '';
    // Uncommitted lines (sha of zeros) belong to this build.
    const time = /^0+$/.test(sha) || !timeOf.has(sha) ? now : timeOf.get(sha)!;
    const key = timeOf.has(sha) && !/^0+$/.test(sha) ? sha : 'now';
    if (!groups.has(key)) groups.set(key, { time, items: [] });
    groups.get(key)!.items.push(item);
  }
  return [...groups.values()].sort((a, b) => b.time.localeCompare(a.time));
}

function versionFile(): Plugin {
  return {
    name: 'version-file',
    apply: 'build',
    // Lets a running game check that a fresh index.html really is the new build.
    transformIndexHtml: (html) => html.replace('<head>', `<head>\n  <meta name="build-id" content="${BUILD_ID}" />`),
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ id: BUILD_ID, time: BUILD_TIME, changelog: CHANGELOG }) });
    },
  };
}

// SINGLE=1 inlines everything into one HTML file (used for quick previews).
export default defineConfig(({ command }) => ({
  base: './',
  build: { target: 'es2022' },
  define: {
    __BUILD_ID__: JSON.stringify(command === 'build' ? BUILD_ID : 'dev'),
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
    __CHANGELOG__: JSON.stringify(CHANGELOG),
  },
  plugins: [versionFile(), ...(process.env.SINGLE ? [viteSingleFile()] : [])],
}));
