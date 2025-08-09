const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Configuration for testing
const TOTAL_RECORDS = 5000; // 5k records for testing
const BATCH_SIZE = 100; // Smaller batches for testing
const LOG_INTERVAL = 100; // Log progress every 100 records

// Sample users to create for change requests
const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Developer',
    email: 'john.developer@company.com',
    password: 'password123',
    role: 'request'
  },
  {
    firstName: 'Sarah',
    lastName: 'Product Manager',
    email: 'sarah.pm@company.com',
    password: 'password123',
    role: 'approve'
  },
  {
    firstName: 'Mike',
    lastName: 'QA Engineer',
    email: 'mike.qa@company.com',
    password: 'password123',
    role: 'request'
  },
  {
    firstName: 'Lisa',
    lastName: 'DevOps Engineer',
    email: 'lisa.devops@company.com',
    password: 'password123',
    role: 'approve'
  },
  {
    firstName: 'David',
    lastName: 'Frontend Developer',
    email: 'david.frontend@company.com',
    password: 'password123',
    role: 'request'
  },
  {
    firstName: 'Emma',
    lastName: 'Backend Developer',
    email: 'emma.backend@company.com',
    password: 'password123',
    role: 'request'
  },
  {
    firstName: 'Alex',
    lastName: 'UI/UX Designer',
    email: 'alex.designer@company.com',
    password: 'password123',
    role: 'view'
  },
  {
    firstName: 'Rachel',
    lastName: 'Data Analyst',
    email: 'rachel.analyst@company.com',
    password: 'password123',
    role: 'request'
  }
];

// Enhanced feature flag templates for variety
const featureFlagTemplates = [
  { 
    prefix: 'ui', 
    descriptions: [
      'User interface improvements', 
      'UI enhancements', 
      'Interface updates',
      'Responsive design features',
      'Accessibility improvements',
      'Dark mode implementation',
      'Mobile optimization',
      'Navigation improvements'
    ] 
  },
  { 
    prefix: 'auth', 
    descriptions: [
      'Authentication features', 
      'Security improvements', 
      'Login enhancements',
      'Two-factor authentication',
      'SSO integration',
      'Password policies',
      'Session management',
      'OAuth implementation'
    ] 
  },
  { 
    prefix: 'payment', 
    descriptions: [
      'Payment processing', 
      'Billing features', 
      'Transaction handling',
      'Subscription management',
      'Invoice generation',
      'Payment gateway integration',
      'Refund processing',
      'Tax calculation'
    ] 
  },
  { 
    prefix: 'analytics', 
    descriptions: [
      'Data analytics', 
      'Reporting features', 
      'Metrics tracking',
      'Dashboard widgets',
      'Export functionality',
      'Real-time monitoring',
      'Performance metrics',
      'User behavior tracking'
    ] 
  },
  { 
    prefix: 'notification', 
    descriptions: [
      'User notifications', 
      'Alert system', 
      'Communication features',
      'Email notifications',
      'Push notifications',
      'SMS alerts',
      'In-app messaging',
      'Webhook integration'
    ] 
  },
  { 
    prefix: 'search', 
    descriptions: [
      'Search functionality',
      'Advanced filtering',
      'Autocomplete features',
      'Search suggestions',
      'Full-text search',
      'Search analytics',
      'Search optimization',
      'Faceted search'
    ]
  },
  { 
    prefix: 'api', 
    descriptions: [
      'API endpoints',
      'Rate limiting',
      'API versioning',
      'GraphQL features',
      'REST improvements',
      'API documentation',
      'Webhook support',
      'API monitoring'
    ]
  },
  { 
    prefix: 'performance', 
    descriptions: [
      'Performance optimizations',
      'Caching strategies',
      'CDN integration',
      'Database optimization',
      'Load balancing',
      'Memory management',
      'Query optimization',
      'Resource compression'
    ]
  },
  { 
    prefix: 'integration', 
    descriptions: [
      'Third-party integrations',
      'CRM integration',
      'Marketing tools',
      'Accounting software',
      'Project management',
      'Communication platforms',
      'Cloud services',
      'Data synchronization'
    ]
  },
  { 
    prefix: 'compliance', 
    descriptions: [
      'GDPR compliance',
      'Data privacy features',
      'Audit logging',
      'Data retention',
      'Consent management',
      'Security standards',
      'Regulatory compliance',
      'Data protection'
    ]
  }
];

// Suffixes for variety
const suffixes = [
  'v2', 'beta', 'alpha', 'preview', 'experimental', 'new', 'enhanced', 'pro', 'lite', 'basic',
  'advanced', 'premium', 'standard', 'enterprise', 'cloud', 'mobile', 'desktop', 'web'
];

// Change request reasons
const changeRequestReasons = [
  'Feature rollout for Q1 2024',
  'Performance improvement initiative',
  'Security enhancement required',
  'User experience optimization',
  'Compliance requirement',
  'Integration with new system',
  'Bug fix deployment',
  'A/B testing setup',
  'Gradual rollout strategy',
  'Emergency hotfix',
  'Scheduled maintenance',
  'Feature deprecation',
  'Testing in production',
  'Load testing preparation',
  'Monitoring setup'
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
    `Implements ${template.prefix} capabilities for better user interaction`,
    `Deploys ${template.prefix} improvements for production use`,
    `Enables ${template.prefix} integration with external systems`,
    `Activates ${template.prefix} monitoring and analytics`,
    `Controls ${template.prefix} access and permissions`,
    `Implements ${template.prefix} security measures`,
    `Deploys ${template.prefix} optimization features`
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

async function createSampleUsers() {
  console.log('Creating sample users for change requests...');
  
  const createdUsers = [];
  
  for (const userData of sampleUsers) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (!existingUser) {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const user = await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword
          }
        });
        
        createdUsers.push(user);
        console.log(`Created user: ${user.firstName} ${user.lastName} (${user.email})`);
      } else {
        createdUsers.push(existingUser);
        console.log(`User already exists: ${existingUser.firstName} ${existingUser.lastName} (${existingUser.email})`);
      }
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error.message);
    }
  }
  
  return createdUsers;
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
    const users = await createSampleUsers();
    
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
        const enabled = Math.random() > 0.6; // 40% chance of being enabled
        
        const flagData = {
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
        };
        
        batch.push(flagData);
      }
      
      // Insert batch
      await prisma.featureFlag.createMany({
        data: batch,
        skipDuplicates: true
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
    
    // Generate change requests for some flags
    await generateChangeRequests(users);
    
  } catch (error) {
    console.error('❌ Error generating feature flags:', error);
    throw error;
  }
}

async function generateChangeRequests(users) {
  console.log('\n🔄 Generating change requests...');
  
  const changeRequestUsers = users.filter(user => user.role === 'request' || user.role === 'approve');
  
  if (changeRequestUsers.length === 0) {
    console.log('⚠️  No users with request/approve roles found for change requests');
    return;
  }
  
  // Fetch a random sample of flags for change requests (about 20% of total)
  const totalFlags = await prisma.featureFlag.count();
  const flagsForChangeRequests = Math.floor(totalFlags * 0.2);
  
  console.log(`Fetching ${flagsForChangeRequests} random flags for change requests...`);
  
  const flags = await prisma.featureFlag.findMany({
    take: flagsForChangeRequests,
    orderBy: {
      id: 'asc'
    }
  });
  
  console.log(`Generating change requests for ${flags.length} flags...`);
  
  const changeRequestBatch = [];
  let changeRequestCount = 0;
  
  for (const flag of flags) {
    const requestingUser = changeRequestUsers[Math.floor(Math.random() * changeRequestUsers.length)];
    const reason = changeRequestReasons[Math.floor(Math.random() * changeRequestReasons.length)];
    const currentValue = flag.enabled;
    const proposedValue = !currentValue; // Flip the current value
    const status = Math.random() > 0.7 ? 'approved' : 'pending'; // 30% approved, 70% pending
    
    let approvedBy = null;
    let approvedAt = null;
    
    if (status === 'approved') {
      const approver = changeRequestUsers.find(user => user.role === 'approve');
      if (approver) {
        approvedBy = approver.id;
        approvedAt = new Date();
      }
    }
    
    const changeRequest = {
      flagId: flag.id,
      requestedBy: requestingUser.id,
      requestReason: reason,
      requestedType: 'toggle',
      proposedValue: proposedValue,
      currentValue: currentValue,
      status: status,
      approvedBy: approvedBy,
      approvedAt: approvedAt,
      comment: status === 'approved' ? 'Approved for deployment' : 'Pending review',
      flagName: flag.name,
      flagKey: flag.key,
      flagDescription: flag.description,
      environmentName: flag.environmentName,
      environmentKey: flag.environmentKey,
      platformName: flag.platformName,
      platformKey: flag.platformKey,
      scopeName: flag.scopeName,
      scopeSlug: flag.scopeSlug
    };
    
    changeRequestBatch.push(changeRequest);
    changeRequestCount++;
    
    // Insert in batches of 50
    if (changeRequestBatch.length >= 50) {
      await prisma.featureFlagChangeRequest.createMany({
        data: changeRequestBatch,
        skipDuplicates: true
      });
      changeRequestBatch.length = 0; // Clear the batch
    }
  }
  
  // Insert remaining change requests
  if (changeRequestBatch.length > 0) {
    await prisma.featureFlagChangeRequest.createMany({
      data: changeRequestBatch,
      skipDuplicates: true
    });
  }
  
  console.log(`Generated ${changeRequestCount} change requests`);
}

async function main() {
  try {
    console.log(' Starting feature flag generation script...');
    
    // Test database connection
    await prisma.$connect();
    console.log(' Database connection established');
    
    // Generate feature flags
    await generateFeatureFlags();
    
  } catch (error) {
    console.error('Script failed:', error);
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
