const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Configuration
const TOTAL_RECORDS = 1000000; // 1 million records
const BATCH_SIZE = 1000; // Process in batches for better performance
const LOG_INTERVAL = 10000; // Log progress every 10k records

// Feature flag templates for variety
const featureFlagTemplates = [
  { prefix: 'ui', descriptions: ['User interface improvements', 'UI enhancements', 'Interface updates'] },
  { prefix: 'auth', descriptions: ['Authentication features', 'Security improvements', 'Login enhancements'] },
  { prefix: 'payment', descriptions: ['Payment processing', 'Billing features', 'Transaction handling'] },
  { prefix: 'analytics', descriptions: ['Data analytics', 'Reporting features', 'Metrics tracking'] },
  { prefix: 'notification', descriptions: ['User notifications', 'Alert system', 'Communication features'] },
  { prefix: 'search', descriptions: ['Search functionality', 'Query improvements', 'Discovery features'] },
  { prefix: 'export', descriptions: ['Data export', 'File generation', 'Report downloads'] },
  { prefix: 'import', descriptions: ['Data import', 'File upload', 'Bulk operations'] },
  { prefix: 'integration', descriptions: ['Third-party integrations', 'API connections', 'External services'] },
  { prefix: 'performance', descriptions: ['Performance optimizations', 'Speed improvements', 'Efficiency enhancements'] },
  { prefix: 'mobile', descriptions: ['Mobile-specific features', 'App enhancements', 'Touch optimizations'] },
  { prefix: 'desktop', descriptions: ['Desktop features', 'Computer optimizations', 'Large screen support'] },
  { prefix: 'accessibility', descriptions: ['Accessibility features', 'ADA compliance', 'Inclusive design'] },
  { prefix: 'localization', descriptions: ['Multi-language support', 'Internationalization', 'Regional features'] },
  { prefix: 'backup', descriptions: ['Data backup', 'Recovery features', 'Storage management'] },
  { prefix: 'sync', descriptions: ['Data synchronization', 'Real-time updates', 'Cross-device sync'] },
  { prefix: 'encryption', descriptions: ['Data encryption', 'Security features', 'Privacy protection'] },
  { prefix: 'audit', descriptions: ['Audit trails', 'Logging features', 'Compliance tracking'] },
  { prefix: 'workflow', descriptions: ['Process automation', 'Workflow management', 'Task optimization'] },
  { prefix: 'dashboard', descriptions: ['Dashboard features', 'Overview panels', 'Control center'] }
];

// Suffixes for variety
const suffixes = [
  'v2', 'beta', 'alpha', 'preview', 'experimental', 'new', 'enhanced', 'pro', 'lite', 'basic',
  'advanced', 'premium', 'standard', 'custom', 'default', 'legacy', 'modern', 'classic', 'next',
  'future', 'current', 'stable', 'unstable', 'testing', 'production', 'development'
];

function generateRandomFlagKey(template) {
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const randomNum = Math.floor(Math.random() * 9999) + 1;
  return `${template.prefix}_${suffix}_${randomNum}`;
}

function generateRandomFlagName(template) {
  const description = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${description} ${suffix}`;
}

function generateRandomDescription(template) {
  const descriptions = [
    `Enables ${template.prefix} functionality for enhanced user experience`,
    `Activates ${template.prefix} features to improve system performance`,
    `Controls ${template.prefix} behavior across different environments`,
    `Manages ${template.prefix} settings for optimal configuration`,
    `Provides ${template.prefix} capabilities for better integration`,
    `Supports ${template.prefix} operations with advanced features`,
    `Implements ${template.prefix} logic for improved functionality`,
    `Enhances ${template.prefix} performance with optimized algorithms`,
    `Enables ${template.prefix} customization for user preferences`,
    `Activates ${template.prefix} analytics for better insights`
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

async function getRequiredData() {
  console.log('Fetching required data (platforms, environments, scopes)...');
  
  const platforms = await prisma.platform.findMany({ where: { isActive: true } });
  const environments = await prisma.environment.findMany({ where: { isActive: true } });
  const scopes = await prisma.featureFlagScope.findMany({ where: { isActive: true } });
  
  if (platforms.length === 0) {
    throw new Error('No active platforms found. Please run the seed script first.');
  }
  if (environments.length === 0) {
    throw new Error('No active environments found. Please run the seed script first.');
  }
  if (scopes.length === 0) {
    throw new Error('No active scopes found. Please run the seed script first.');
  }
  
  console.log(`Found ${platforms.length} platforms, ${environments.length} environments, ${scopes.length} scopes`);
  
  return { platforms, environments, scopes };
}

async function generateFeatureFlags() {
  try {
    const { platforms, environments, scopes } = await getRequiredData();
    
    console.log(`Starting generation of ${TOTAL_RECORDS.toLocaleString()} feature flag records...`);
    console.log(`Processing in batches of ${BATCH_SIZE} records`);
    
    const startTime = Date.now();
    let processedCount = 0;
    
    for (let i = 0; i < TOTAL_RECORDS; i += BATCH_SIZE) {
      const batchSize = Math.min(BATCH_SIZE, TOTAL_RECORDS - i);
      const batch = [];
      
      for (let j = 0; j < batchSize; j++) {
        const template = featureFlagTemplates[Math.floor(Math.random() * featureFlagTemplates.length)];
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        const environment = environments[Math.floor(Math.random() * environments.length)];
        const scope = scopes[Math.floor(Math.random() * scopes.length)];
        
        const flagKey = generateRandomFlagKey(template);
        const flagName = generateRandomFlagName(template);
        const description = generateRandomDescription(template);
        const enabled = Math.random() > 0.5; // 50% chance of being enabled
        
        batch.push({
          key: flagKey,
          name: flagName,
          description: description,
          enabled: enabled,
          scopeId: scope.id,
          scopeSlug: scope.slug,
          platformId: platform.id,
          platformKey: platform.key,
          environmentId: environment.id,
          environmentKey: environment.key
        });
      }
      
      // Insert batch
      await prisma.featureFlag.createMany({
        data: batch,
        skipDuplicates: true // Skip if unique constraint violation
      });
      
      processedCount += batch.length;
      
      // Log progress
      if (processedCount % LOG_INTERVAL === 0) {
        const elapsed = Date.now() - startTime;
        const rate = Math.round(processedCount / (elapsed / 1000));
        const remaining = TOTAL_RECORDS - processedCount;
        const eta = Math.round(remaining / rate);
        
        console.log(`Progress: ${processedCount.toLocaleString()}/${TOTAL_RECORDS.toLocaleString()} records (${Math.round(processedCount/TOTAL_RECORDS*100)}%)`);
        console.log(`Rate: ${rate} records/sec, ETA: ${eta} seconds`);
      }
    }
    
    const totalTime = Date.now() - startTime;
    const avgRate = Math.round(TOTAL_RECORDS / (totalTime / 1000));
    
    console.log('\n✅ Feature flag generation completed!');
    console.log(`📊 Total records generated: ${TOTAL_RECORDS.toLocaleString()}`);
    console.log(`⏱️  Total time: ${Math.round(totalTime/1000)} seconds`);
    console.log(`🚀 Average rate: ${avgRate} records/second`);
    
  } catch (error) {
    console.error('❌ Error generating feature flags:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting feature flag generation script...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection established');
    
    // Generate feature flags
    await generateFeatureFlags();
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generateFeatureFlags };
