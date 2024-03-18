import { build } from 'esbuild';
import { writeFileSync } from 'fs';

export default async function rebuild() {
    await build({
        entryPoints: ['src/index.ts'],
        bundle: true,
        minify: true,
        sourcemap: true,
        outfile: 'build/index.js',
    }).catch(() => process.exit(1));

    writeFileSync(
        'build/index.js',
        `// ==UserScript==
// @name         Krunker skinchanger
// @namespace    ss
// @version      69
// @description  zedboy is the goat, as per usual
// @author       zedboy
// @match        *://*.krunker.io/*
// @run-at       document-start
// @icon         https://www.google.com/s2/favicons?sz=64&domain=krunker.io
// @grant        none
// ==/UserScript==
` + require('fs').readFileSync('build/index.js', 'utf8')
    );
}

rebuild();
