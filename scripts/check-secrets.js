#!/usr/bin/env node

/**
 * Prebuild script to check for placeholder secrets and hardcoded values
 */
const fs = require('fs');
const path = require('path');

// Placeholder patterns that should not be in production
const PLACEHOLDER_PATTERNS = [
  /AIzaSy[a-zA-Z0-9_-]{35}/, // Google API key pattern (but check if it's a real placeholder)
  /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/, // JWT token pattern
  /qaqmlmshpifwdnrvfkao/, // Supabase project ID (if it's a placeholder)
  /sk_test_[a-zA-Z0-9]{24}/, // Stripe test key
  /pk_test_[a-zA-Z0-9]{24}/, // Stripe publishable test key
  /rzp_test_[a-zA-Z0-9]{14}/, // Razorpay test key
];

// Known placeholder values that should trigger errors
const KNOWN_PLACEHOLDERS = [
  'your-api-key-here',
  'YOUR_SECRET_KEY',
  'placeholder-key',
  'test-key-123',
  'demo-api-key',
  'localhost-key',
  'AIzaSyCoS3UexTT-0nRhoyFEoXml7KQtUaCFPMk', // Known demo Google Maps key
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // Check for placeholder patterns
  PLACEHOLDER_PATTERNS.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (KNOWN_PLACEHOLDERS.includes(match)) {
          issues.push({
            file: filePath,
            type: 'placeholder',
            value: match,
            line: getLineNumber(content, match)
          });
        }
      });
    }
  });

  // Check for known placeholder strings
  KNOWN_PLACEHOLDERS.forEach(placeholder => {
    if (content.includes(placeholder)) {
      issues.push({
        file: filePath,
        type: 'known_placeholder',
        value: placeholder,
        line: getLineNumber(content, placeholder)
      });
    }
  });

  return issues;
}

function getLineNumber(content, searchString) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchString)) {
      return i + 1;
    }
  }
  return 0;
}

function scanDirectory(dirPath, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const issues = [];
  
  function scan(currentPath) {
    const entries = fs.readdirSync(currentPath);
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other unnecessary directories
        if (!['node_modules', '.git', 'dist', 'build'].includes(entry)) {
          scan(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(entry);
        if (extensions.includes(ext)) {
          const fileIssues = checkFile(fullPath);
          issues.push(...fileIssues);
        }
      }
    }
  }
  
  scan(dirPath);
  return issues;
}

function checkEnvironmentVariables() {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_GOOGLE_MAPS_API_KEY'
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    return false;
  }

  // Check for placeholder values in environment variables
  const placeholderEnvs = requiredEnvVars.filter(varName => {
    const value = process.env[varName];
    return KNOWN_PLACEHOLDERS.some(placeholder => value?.includes(placeholder));
  });

  if (placeholderEnvs.length > 0) {
    console.error('❌ Environment variables contain placeholder values:');
    placeholderEnvs.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    return false;
  }

  return true;
}

function main() {
  console.log('🔍 Checking for secrets and placeholder values...');

  // Check environment variables
  const envOk = checkEnvironmentVariables();

  // Scan source files
  const srcIssues = scanDirectory('./src');
  const publicIssues = scanDirectory('./public', ['.html', '.js']);
  
  const allIssues = [...srcIssues, ...publicIssues];

  if (!envOk || allIssues.length > 0) {
    console.error('\n❌ Security issues found:');
    
    if (allIssues.length > 0) {
      console.error('\nPlaceholder secrets found in source code:');
      allIssues.forEach(issue => {
        console.error(`   ${issue.file}:${issue.line} - ${issue.type}: ${issue.value}`);
      });
    }

    console.error('\n🚫 Build failed due to security issues.');
    console.error('Please replace all placeholder values with proper environment variables.');
    process.exit(1);
  }

  console.log('✅ Security check passed. No placeholder secrets found.');
}

// Run the check
main();