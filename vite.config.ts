import { defineConfig, Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Each build gets an ID, baked into the bundle and written to version.json, so a
// running game can spot that a newer deploy is live and offer a reload.
const BUILD_ID = process.env.GITHUB_SHA?.slice(0, 12) || `local-${Date.now()}`;

function versionFile(): Plugin {
  return {
    name: 'version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ id: BUILD_ID }) });
    },
  };
}

// SINGLE=1 inlines everything into one HTML file (used for quick previews).
export default defineConfig(({ command }) => ({
  base: './',
  build: { target: 'es2022' },
  define: { __BUILD_ID__: JSON.stringify(command === 'build' ? BUILD_ID : 'dev') },
  plugins: [versionFile(), ...(process.env.SINGLE ? [viteSingleFile()] : [])],
}));
