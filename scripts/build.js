/**
 * Build Script for Meilin Starwell App
 * 
 * This script:
 * 1. Cleans the dist/ directory
 * 2. Copies all source files to dist/
 * 3. Fetches CDN scripts and computes SRI hashes
 * 4. Injects SRI hashes into dist/index.html
 * 
 * Usage: node scripts/build.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Configuration
const SRC_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

// CDN scripts to process for SRI
const CDN_SCRIPTS = [
    {
        url: 'https://unpkg.com/lucide@0.562.0/dist/umd/lucide.min.js',
        pattern: /src="https:\/\/unpkg\.com\/lucide@0\.562\.0\/dist\/umd\/lucide\.min\.js"/g
    },
    {
        url: 'https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js',
        pattern: /src="https:\/\/cdn\.jsdelivr\.net\/npm\/marked@9\.1\.6\/marked\.min\.js"/g
    }
];

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
 * Fetch a URL and return its content as a Buffer
 */
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                // Follow redirect
                fetchUrl(res.headers.location).then(resolve).catch(reject);
                return;
            }
            
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
                return;
            }
            
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Compute SRI hash for content
 */
function computeSRI(content) {
    const hash = crypto.createHash('sha384').update(content).digest('base64');
    return `sha384-${hash}`;
}

/**
 * Main build function
 */
async function build() {
    console.log('🔨 Building Meilin Starwell App...\n');
    
    // Step 1: Clean dist directory
    console.log('📁 Cleaning dist directory...');
    cleanDir(DIST_DIR);
    
    // Step 2: Copy source files
    console.log('📋 Copying source files...');
    copyDir(SRC_DIR, DIST_DIR);
    
    // Step 3: Fetch CDN scripts and compute SRI hashes
    console.log('🔐 Computing SRI hashes for CDN scripts...');
    const sriHashes = new Map();
    
    for (const script of CDN_SCRIPTS) {
        try {
            console.log(`   Fetching: ${script.url}`);
            const content = await fetchUrl(script.url);
            const sri = computeSRI(content);
            sriHashes.set(script.url, sri);
            console.log(`   SRI: ${sri.substring(0, 30)}...`);
        } catch (error) {
            console.error(`   ⚠️  Failed to fetch ${script.url}: ${error.message}`);
            console.log('   Using placeholder SRI (will need manual update)');
            sriHashes.set(script.url, 'sha384-PLACEHOLDER');
        }
    }
    
    // Step 4: Inject SRI hashes into index.html
    console.log('💉 Injecting SRI hashes into index.html...');
    const indexPath = path.join(DIST_DIR, 'index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    for (const script of CDN_SCRIPTS) {
        const sri = sriHashes.get(script.url);
        const replacement = `src="${script.url}" integrity="${sri}"`;
        indexContent = indexContent.replace(script.pattern, replacement);
    }
    
    // Remove the TODO comments about SRI
    indexContent = indexContent.replace(
        /\s*<!-- TODO: Add SRI integrity hash via build script: https:\/\/www\.srihash\.org\/ -->\n/g,
        '\n'
    );
    
    fs.writeFileSync(indexPath, indexContent);
    
    // Step 5: Copy 404.html to dist (GitHub Pages needs it at root)
    const notFoundSrc = path.join(SRC_DIR, '404.html');
    const notFoundDest = path.join(DIST_DIR, '404.html');
    if (fs.existsSync(notFoundSrc)) {
        fs.copyFileSync(notFoundSrc, notFoundDest);
    }
    
    console.log('\n✅ Build complete! Output in dist/\n');
    
    // Print summary
    const files = countFiles(DIST_DIR);
    console.log(`📊 Summary: ${files} files in dist/`);
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

// Run build
build().catch((error) => {
    console.error('❌ Build failed:', error);
    process.exit(1);
});
