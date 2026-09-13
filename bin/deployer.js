#!/usr/bin/env node

/**
 * @fileoverview Binaire executable principal pour le CLI AMBO Deployer.
 * @author AMBO Tech
 * @license MIT
 */

const path = require('path');
const fs = require('fs');

// Verification de la presence du build compile
const distIndexPath = path.join(__dirname, '..', 'dist', 'index.js');

if (!fs.existsSync(distIndexPath)) {
  console.log('[INFO] Compilation TypeScript des fichiers sources en cours...');
  try {
    const { execSync } = require('child_process');
    execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  } catch (err) {
    console.error('[ERROR] Echec de la compilation TypeScript. Veuillez executer `npm run build`.');
    process.exit(1);
  }
}

require(distIndexPath);
