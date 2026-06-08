#!/usr/bin/env node
/**
 * Patch @webos-tools/cli for rimraf v6 compatibility (Node 20+).
 * Re-run after npm install: npm run postinstall
 */
'use strict';

const fs = require('fs');
const path = require('path');

const packageJs = path.join(__dirname, '../node_modules/@webos-tools/cli/lib/package.js');
const shim = `    rimraf = (function() {
        const mod = require('rimraf');
        if (typeof mod === 'function') {
            return mod;
        }
        const remove = mod.rimraf || mod;
        const shim = function(p, cb) {
            remove(p).then(function() { if (cb) { cb(null); } }).catch(function(err) { if (cb) { cb(err); } });
        };
        shim.sync = mod.rimrafSync || mod.sync;
        return shim;
    }()),`;

if (!fs.existsSync(packageJs)) {
  console.log('patch-cli: @webos-tools/cli not installed, skipping');
  process.exit(0);
}

let content = fs.readFileSync(packageJs, 'utf8');
const legacy = "rimraf = require('rimraf'),";
const broken = "rimraf = require('rimraf').rimraf || require('rimraf'),";

if (content.includes(shim)) {
  console.log('patch-cli: already patched');
  process.exit(0);
}

if (content.includes(legacy)) {
  content = content.replace(legacy, shim);
} else if (content.includes(broken)) {
  content = content.replace(broken, shim);
} else {
  console.warn('patch-cli: could not find rimraf line to patch');
  process.exit(1);
}

fs.writeFileSync(packageJs, content);
console.log('patch-cli: patched rimraf shim in @webos-tools/cli');
