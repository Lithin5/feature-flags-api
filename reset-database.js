const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Database Reset Script\n');

async function runCommand(command, description) {
  try {
    console.log(`📋 ${description}...`);
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname)
    });
    console.log(`✅ ${description} completed successfully!\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

async function main() {
  console.log('⚠️  WARNING: This will completely reset your database!');
  console.log('   - All data will be deleted');
  console.log('   - Database schema will be recreated');
  console.log('   - Fresh seed data will be inserted');
  console.log('');
  
  // Check if user wants to continue
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise((resolve) => {
    rl.question('Are you sure you want to continue? (y/N): ', resolve);
  });
  
  rl.close();

  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    console.log('❌ Database reset cancelled.');
    process.exit(0);
  }

  console.log('\n🔄 Starting database reset...\n');

  // Step 1: Reset database using Prisma
  const resetSuccess = await runCommand(
    'npx prisma migrate reset --force',
    'Resetting database (drops all data and recreates schema)'
  );

  if (!resetSuccess) {
    console.error('❌ Database reset failed.');
    process.exit(1);
  }

  // Step 2: Push schema to ensure it's up to date
  const pushSuccess = await runCommand(
    'npx prisma db push',
    'Pushing latest schema changes'
  );

  if (!pushSuccess) {
    console.error('❌ Schema push failed.');
    process.exit(1);
  }

  // Step 3: Seed basic data
  const seedSuccess = await runCommand(
    'npx prisma db seed',
    'Seeding basic data (platforms, environments, scopes, admin user)'
  );

  if (!seedSuccess) {
    console.error('❌ Data seeding failed.');
    process.exit(1);
  }

  console.log('🎉 Database reset completed successfully!');
  console.log('📋 Available next steps:');
  console.log('  npm run db:generate                - Generate 5000 feature flags');
  console.log('  npm run db:generate:test           - Generate 10 test flags');
  console.log('  npm run db:setup:with-flags        - Full setup with flags');
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.length > 0) {
  const command = args[0];
  
  if (command === '--force' || command === '-f') {
    console.log('🔄 Force reset mode - skipping confirmation...\n');
    
    runCommand('npx prisma migrate reset --force', 'Resetting database')
      .then(() => runCommand('npx prisma db push', 'Pushing schema'))
      .then(() => runCommand('npx prisma db seed', 'Seeding data'))
      .then(() => {
        console.log('🎉 Database reset completed successfully!');
      })
      .catch((error) => {
        console.error('❌ Database reset failed:', error.message);
        process.exit(1);
      });
  } else {
    console.log('❌ Unknown option. Use --force or -f to skip confirmation.');
    process.exit(1);
  }
} else {
  main();
}
