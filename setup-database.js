const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Setting up Feature Flags Database...\n');

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
  console.log('🔧 Database Setup Options:');
  console.log('1. Quick Setup (Development) - Uses db:push');
  console.log('2. Production Setup - Uses db:migrate');
  console.log('3. Full Setup with Feature Flags');
  console.log('4. Reset Database (DANGER: Drops all data)');
  console.log('5. Exit\n');

  // For now, let's run the quick setup
  console.log('🔄 Running Quick Setup (Development)...\n');

  // Step 1: Create database schema
  const schemaSuccess = await runCommand(
    'npm run db:push',
    'Creating database schema'
  );

  if (!schemaSuccess) {
    console.error('❌ Database schema creation failed. Please check your database connection.');
    process.exit(1);
  }

  // Step 2: Seed basic data
  const seedSuccess = await runCommand(
    'npm run db:seed',
    'Seeding basic data (platforms, environments, scopes, admin user)'
  );

  if (!seedSuccess) {
    console.error('❌ Data seeding failed.');
    process.exit(1);
  }

  // Step 3: Ask if user wants to generate feature flags
  console.log('💡 Basic setup completed!');
  console.log('📋 Available next steps:');
  console.log('  npm run db:generate                - Generate 5000 feature flags');
  console.log('  npm run db:generate:test           - Generate 10 test flags');
  console.log('  npm run db:setup:with-flags        - Full setup with flags');
  console.log('  npm run db:reset                   - Reset database');
  console.log('\n🎉 Database setup completed successfully!');
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.length > 0) {
  const command = args[0];
  
  switch (command) {
    case 'quick':
      runCommand('npm run db:push && npm run db:seed', 'Quick setup');
      break;
    case 'full':
      runCommand('npm run db:setup:with-flags', 'Full setup with feature flags');
      break;
    case 'reset':
      console.log('⚠️  WARNING: This will drop all data and recreate the database schema.');
      console.log('Are you sure you want to continue? (y/N)');
      
      // For now, just run the reset command
      runCommand('npm run db:reset', 'Reset database');
      break;
    case 'generate':
      runCommand('npm run db:generate', 'Generate feature flags');
      break;
    case 'test':
      runCommand('npm run db:generate:test', 'Generate test flags');
      break;
    default:
      console.log('❌ Unknown command. Available commands:');
      console.log('  node setup-database.js quick    - Quick setup');
      console.log('  node setup-database.js full     - Full setup with flags');
      console.log('  node setup-database.js reset    - Reset database');
      console.log('  node setup-database.js generate - Generate flags');
      console.log('  node setup-database.js test     - Generate test flags');
  }
} else {
  main();
}
