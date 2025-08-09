const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Testing seed and generation connection...\n');

try {
  // Test 1: Run seed with generation enabled
  console.log('1️⃣ Testing seed with GENERATE_FLAGS=true...');
  execSync('GENERATE_FLAGS=true npx prisma db seed', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname)
  });
  
  console.log('\n✅ Test 1 passed: Seed with generation works!');
  
} catch (error) {
  console.error('\n❌ Test 1 failed:', error.message);
}

console.log('\n📋 Available commands:');
console.log('  npm run db:seed                    - Basic seed only');
console.log('  npm run db:generate                - Generate flags only');
console.log('  npm run db:setup                   - Seed + Generate separately');
console.log('  npm run db:setup:with-flags        - Seed + Generate together');
console.log('  npm run db:generate:test           - Quick test (10 flags)');
