#!/usr/bin/env node

/**
 * @fileoverview Binaire exécutable principal pour le CLI AMBO Deployer.
 * @author AMBO Tech
 * @license MIT
 */

const path = require('path');
const fs = require('fs');

// Vérification de la présence du build compilé
const distIndexPath = path.join(__dirname, '..', 'dist', 'index.js');

if (!fs.existsSync(distIndexPath)) {
  console.log('📦 Compilation TypeScript des fichiers sources en cours...');
  try {
    const { execSync } = require('child_process');
    execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  } catch (err) {
    console.error('❌ Échec de la compilation TypeScript. Veuillez exécuter `npm run build`.');
    process.exit(1);
  }
}

require(distIndexPath);
