#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');

// Configuration for Lighthouse CI
const config = {
  urls: [
    'http://localhost:8080',
    'http://localhost:8080/medicines',
    'http://localhost:8080/doctors',
    'http://localhost:8080/lab-tests',
  ],
  thresholds: {
    performance: 90,
    accessibility: 90,
    'best-practices': 85,
    seo: 85,
  }
};

console.log('🚀 Starting Lighthouse CI audit...');

// Build the project first
console.log('📦 Building project...');
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }

  console.log('✅ Build completed');
  
  // Start preview server
  console.log('🌐 Starting preview server...');
  const preview = exec('npm run preview');
  
  // Wait for server to start, then run Lighthouse
  setTimeout(() => {
    console.log('🔍 Running Lighthouse audits...');
    
    const auditPromises = config.urls.map(url => runLighthouseAudit(url));
    
    Promise.all(auditPromises)
      .then(results => {
        console.log('📊 Lighthouse CI Results:');
        
        let allPassed = true;
        results.forEach((result, index) => {
          const url = config.urls[index];
          console.log(`\n🔗 ${url}:`);
          
          Object.entries(result.categories).forEach(([category, data]) => {
            const score = Math.round(data.score * 100);
            const threshold = config.thresholds[category];
            const passed = score >= threshold;
            const emoji = passed ? '✅' : '❌';
            
            console.log(`  ${emoji} ${category}: ${score}% (threshold: ${threshold}%)`);
            
            if (!passed) allPassed = false;
          });
        });
        
        console.log(allPassed ? '\n🎉 All thresholds passed!' : '\n💥 Some thresholds failed!');
        preview.kill();
        process.exit(allPassed ? 0 : 1);
      })
      .catch(err => {
        console.error('❌ Lighthouse audit failed:', err);
        preview.kill();
        process.exit(1);
      });
  }, 3000);
});

function runLighthouseAudit(url) {
  return new Promise((resolve, reject) => {
    const command = `npx lighthouse ${url} --output=json --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve(result.lhr);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}