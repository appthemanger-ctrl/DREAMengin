#!/usr/bin/env node

/**
 * DREAMengin Enhancement Pre-Deployment Validation Script
 * 
 * This script validates that all enhancements are properly configured
 * and ready for production deployment.
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFile(filepath, description) {
  const exists = fs.existsSync(filepath);
  if (exists) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description} - NOT FOUND`, 'red');
    return false;
  }
}

function checkFileContent(filepath, searchString, description) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const found = content.includes(searchString);
    if (found) {
      log(`✓ ${description}`, 'green');
      return true;
    } else {
      log(`✗ ${description} - NOT FOUND IN FILE`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`✗ ${description} - ERROR READING FILE`, 'red');
    return false;
  }
}

function main() {
  log('\n========================================', 'cyan');
  log('DREAMengin Enhancement Validation', 'cyan');
  log('========================================\n', 'cyan');

  let allPassed = true;
  const results = {
    components: 0,
    config: 0,
    docs: 0,
    integration: 0,
  };

  // Check Enhanced Components
  log('Checking Enhanced Components...', 'blue');
  const components = [
    ['components/SkeletonLoaders.tsx', 'Skeleton Loading System'],
    ['components/ToastSystem.tsx', 'Toast Notification System'],
    ['components/CommandPalette.tsx', 'Command Palette'],
  ];

  components.forEach(([file, desc]) => {
    if (checkFile(file, desc)) results.components++;
    else allPassed = false;
  });

  // Check Configuration Files
  log('\nChecking Configuration Files...', 'blue');
  const configs = [
    ['package.json', 'Package Configuration'],
    ['next.config.mjs', 'Next.js Configuration'],
    ['tailwind.config.ts', 'Tailwind Configuration'],
    ['tsconfig.json', 'TypeScript Configuration'],
    ['app/globals-enhanced.css', 'Enhanced Global Styles'],
  ];

  configs.forEach(([file, desc]) => {
    if (checkFile(file, desc)) results.config++;
    else allPassed = false;
  });

  // Check Documentation
  log('\nChecking Documentation...', 'blue');
  const docs = [
    ['ENHANCEMENT_DOCUMENTATION.md', 'Enhancement Documentation'],
    ['MIGRATION_GUIDE.md', 'Migration Guide'],
    ['README.md', 'Project README'],
  ];

  docs.forEach(([file, desc]) => {
    if (checkFile(file, desc)) results.docs++;
    else allPassed = false;
  });

  // Check Integration Points
  log('\nChecking Integration Points...', 'blue');
  
  // Check if animations are in CSS (either the default or enhanced global stylesheet)
  const hasKeyframesInDefault = checkFileContent(
    'app/globals.css',
    '@keyframes',
    'Animation keyframes in globals.css'
  );

  const hasKeyframesInEnhanced = checkFileContent(
    'app/globals-enhanced.css',
    '@keyframes',
    'Animation keyframes in globals-enhanced.css'
  );

  if (hasKeyframesInDefault || hasKeyframesInEnhanced) {
    results.integration++;
  } else {
    log('  → Add keyframes to globals.css or use globals-enhanced.css', 'yellow');
  }

  // Check package.json scripts
  const checkScripts = [
    ['package.json', '"build"', 'Build script configured'],
    ['package.json', '"dev"', 'Dev script configured'],
    ['package.json', '"start"', 'Start script configured'],
  ];

  checkScripts.forEach(([file, search, desc]) => {
    if (checkFileContent(file, search, desc)) {
      results.integration++;
    } else {
      allPassed = false;
    }
  });

  // Summary
  log('\n========================================', 'cyan');
  log('Validation Summary', 'cyan');
  log('========================================\n', 'cyan');

  log(`Components: ${results.components}/${components.length}`, 
    results.components === components.length ? 'green' : 'yellow');
  log(`Configuration: ${results.config}/${configs.length}`, 
    results.config === configs.length ? 'green' : 'yellow');
  log(`Documentation: ${results.docs}/${docs.length}`, 
    results.docs === docs.length ? 'green' : 'yellow');
  log(`Integration: ${results.integration}/${checkScripts.length + 1}`, 
    results.integration === checkScripts.length + 1 ? 'green' : 'yellow');

  log('\n========================================', 'cyan');
  if (allPassed) {
    log('✓ ALL CHECKS PASSED', 'green');
    log('Ready for deployment!', 'green');
    process.exit(0);
  } else {
    log('✗ SOME CHECKS FAILED', 'red');
    log('Please review the issues above before deploying.', 'yellow');
    process.exit(1);
  }
}

main();
