/**
 * Creative Option Validation
 * Hard safety checks to filter out options that break the system
 */

import type {
  CreativeOption,
  CreativeValidationResult,
  HardFailureReason,
} from './types';

/**
 * Validate a creative option against hard failure rules
 */
export function validateCreativeOption(
  option: CreativeOption
): CreativeValidationResult {
  const failures: HardFailureReason[] = [];

  // Check for various hard failure conditions
  if (checkBreaksBuild(option)) {
    failures.push({
      type: 'breaks_build',
      message: 'Option would break the build process',
    });
  }

  if (checkBreaksVercel(option)) {
    failures.push({
      type: 'breaks_vercel',
      message: 'Option would break Vercel deployment',
    });
  }

  if (checkBreaksPrivacy(option)) {
    failures.push({
      type: 'breaks_privacy',
      message: 'Option violates privacy constraints',
    });
  }

  if (checkBreaksNavigation(option)) {
    failures.push({
      type: 'breaks_navigation',
      message: 'Option breaks navigation continuity',
    });
  }

  if (checkFakeAction(option)) {
    failures.push({
      type: 'fake_action',
      message: 'Option contains fake or non-functional actions',
    });
  }

  if (checkInvalidTypeScript(option)) {
    failures.push({
      type: 'invalid_typescript',
      message: 'Option contains invalid TypeScript syntax',
    });
  }

  if (checkInvalidImports(option)) {
    failures.push({
      type: 'invalid_imports',
      message: 'Option contains invalid or circular imports',
    });
  }

  if (checkInfiniteLoop(option)) {
    failures.push({
      type: 'infinite_loop',
      message: 'Option may create infinite loops',
    });
  }

  if (checkPerformanceRegression(option)) {
    failures.push({
      type: 'performance_regression',
      message: 'Option causes severe performance regression',
    });
  }

  return {
    valid: failures.length === 0,
    failures: failures.length > 0 ? failures : undefined,
  };
}

// Individual validation functions

function checkBreaksBuild(option: CreativeOption): boolean {
  const content = option.content.toLowerCase();

  // Check for patterns that would break the build
  const breakPatterns = [
    /syntax\s+error/i,
    /cannot\s+find\s+module/i,
    /compilation\s+error/i,
    /build\s+failed/i,
  ];

  // Check if metadata indicates build issues
  if (option.metadata?.breaksBuild === true) {
    return true;
  }

  return breakPatterns.some(pattern => pattern.test(content));
}

function checkBreaksVercel(option: CreativeOption): boolean {
  const content = option.content.toLowerCase();

  // Check for patterns that would break Vercel
  const vercelBreakPatterns = [
    /serverless\s+function\s+timeout/i,
    /exceeds\s+50mb/i,
    /invalid\s+vercel\.json/i,
  ];

  if (option.metadata?.breaksVercel === true) {
    return true;
  }

  return vercelBreakPatterns.some(pattern => pattern.test(content));
}

function checkBreaksPrivacy(option: CreativeOption): boolean {
  const content = option.content.toLowerCase();

  // Check for privacy violations
  const privacyViolations = [
    /expose\s+user\s+data/i,
    /leak\s+credentials/i,
    /public\s+private\s+information/i,
    /share\s+email\s+address/i,
    /bypass\s+rls/i,
    /disable\s+row\s+level\s+security/i,
  ];

  if (option.metadata?.breaksPrivacy === true) {
    return true;
  }

  return privacyViolations.some(pattern => pattern.test(content));
}

function checkBreaksNavigation(option: CreativeOption): boolean {
  const content = option.content.toLowerCase();

  // Check for navigation breaks
  const navBreakPatterns = [
    /broken\s+link/i,
    /404\s+error/i,
    /navigation\s+loop/i,
    /infinite\s+redirect/i,
  ];

  if (option.metadata?.breaksNavigation === true) {
    return true;
  }

  return navBreakPatterns.some(pattern => pattern.test(content));
}

function checkFakeAction(option: CreativeOption): boolean {
  const content = option.content.toLowerCase();

  // Check for fake actions
  const fakeActionPatterns = [
    /console\.log.*instead\s+of/i,
    /mock\s+implementation/i,
    /placeholder\s+function/i,
    /todo:\s+implement/i,
  ];

  if (option.metadata?.fakeAction === true) {
    return true;
  }

  return fakeActionPatterns.some(pattern => pattern.test(content));
}

function checkInvalidTypeScript(option: CreativeOption): boolean {
  const content = option.content;

  // Basic TypeScript syntax checks
  const invalidTsPatterns = [
    /\bany\b.*=.*undefined.*as\s+string/i, // Unsafe type casting
    /\bimport\s+\*\s+from\s+['"]['"]/i, // Empty import
    /\bexport\s+\{[\s,]*\}/i, // Empty export
  ];

  if (option.metadata?.invalidTypeScript === true) {
    return true;
  }

  // Check for unbalanced brackets
  const openBraces = (content.match(/\{/g) || []).length;
  const closeBraces = (content.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    return true;
  }

  return invalidTsPatterns.some(pattern => pattern.test(content));
}

function checkInvalidImports(option: CreativeOption): boolean {
  const content = option.content.toLowerCase();

  // Check for invalid imports
  const invalidImportPatterns = [
    /import.*from\s+['"]\s*['"]/i, // Empty import path
    /import.*\.\.\/\.\.\/\.\.\/\.\.\/\.\.\//i, // Too many parent directory traversals
    /circular\s+dependency/i,
  ];

  if (option.metadata?.invalidImports === true) {
    return true;
  }

  return invalidImportPatterns.some(pattern => pattern.test(content));
}

function checkInfiniteLoop(option: CreativeOption): boolean {
  const content = option.content.toLowerCase();

  // Check for potential infinite loops
  const infiniteLoopPatterns = [
    /while\s*\(\s*true\s*\)/i,
    /for\s*\(\s*;\s*;\s*\)/i,
    /infinite\s+loop/i,
    /useeffect.*\[\s*\].*setstate/i, // React infinite loop pattern
  ];

  if (option.metadata?.infiniteLoop === true) {
    return true;
  }

  return infiniteLoopPatterns.some(pattern => pattern.test(content));
}

function checkPerformanceRegression(option: CreativeOption): boolean {
  const content = option.content.toLowerCase();

  // Check for performance issues
  const perfRegressionPatterns = [
    /n\^2\s+complexity/i,
    /exponential\s+time/i,
    /memory\s+leak/i,
    /synchronous\s+in\s+loop/i,
  ];

  if (option.metadata?.performanceRegression === true) {
    return true;
  }

  // Check for excessive complexity indicators
  if (option.metadata?.complexity && option.metadata.complexity > 100) {
    return true;
  }

  return perfRegressionPatterns.some(pattern => pattern.test(content));
}
