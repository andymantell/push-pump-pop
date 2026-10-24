import { readFileSync } from 'node:fs';
import { defineConfig, Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Each build gets an ID, baked into the bundle and written to version.json, so a
// running game can spot that a newer deploy is live and offer a reload.
const BUILD_ID = process.env.GITHUB_SHA?.slice(0, 12) || `local-${Date.now()}`;
// Player-facing release notes. version.json carries them too, so an old build can
// show the lines it doesn't have yet.
const CHANGELOG = JSON.parse(readFileSync('changelog.json', 'utf8'));

function versionFile(): Plugin {
  return {
    name: 'version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ id: BUILD_ID, changelog: CHANGELOG }) });
    },
  };
}

// SINGLE=1 inlines everything into one HTML file (used for quick previews).
export default defineConfig(({ command }) => ({
  base: './',
  build: { target: 'es2022' },
  define: {
    __BUILD_ID__: JSON.stringify(command === 'build' ? BUILD_ID : 'dev'),
    __CHANGELOG__: JSON.stringify(CHANGELOG),
  },
  plugins: [versionFile(), ...(process.env.SINGLE ? [viteSingleFile()] : [])],
}));
