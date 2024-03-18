import { createReadStream } from 'fs';
import { createServer } from 'http';
import { join } from 'path';
import rebuild from './build';

createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        await rebuild();
        createReadStream(join(__dirname, '../build/', req.url!)).pipe(res);
    } catch {
        res.writeHead(404);
        res.end();
    }
}).listen(3000, () => {
    console.log(`Server running on http://localhost:3000
Tampermonkey dev script:

// ==UserScript==
// @name         Krunker skinchanger (dev)
// @namespace    ss
// @version      69
// @description  zedboy is the goat, as per usual
// @author       zedboy
// @match        *://*.krunker.io/*
// @run-at       document-start
// @icon         https://www.google.com/s2/favicons?sz=64&domain=krunker.io
// @grant        none
// ==/UserScript==

(() => {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://localhost:3000/index.js', false);
    xhr.send();
    eval(xhr.responseText);
})();`);
});
