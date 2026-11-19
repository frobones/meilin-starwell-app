/**
 * Build Script for Meilin Starwell App
 *
 * Copies the deployable site into dist/ for GitHub Pages, leaving out repo
 * tooling. Third-party scripts are vendored in js/vendor/ (pinned versions,
 * licenses alongside), so the build fetches nothing from the network.
 *
 * Usage: node scripts/build.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

// Directories and files to exclude from copy
const EXCLUDE = [
    'node_modules',
    'dist',
    '.git',
    '.github',
    'scripts',
    'package.json',
    'package-lock.json',
    '.gitignore',
    '.DS_Store'
];

/**
 * Recursively copy directory
 */
function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        if (EXCLUDE.includes(entry.name)) continue;

        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Clean directory
 */
function cleanDir(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true });
    }
    fs.mkdirSync(dir, { recursive: true });
}

/**
 * Count files in directory recursively
 */
function countFiles(dir) {
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            count += countFiles(path.join(dir, entry.name));
        } else {
            count++;
        }
    }

    return count;
}

/**
 * Main build function
 */
function build() {
    console.log('🔨 Building Meilin Starwell App...\n');

    console.log('📁 Cleaning dist directory...');
    cleanDir(DIST_DIR);

    console.log('📋 Copying site files...');
    copyDir(SRC_DIR, DIST_DIR);

    console.log(`\n✅ Build complete! ${countFiles(DIST_DIR)} files in dist/\n`);
}

build();
