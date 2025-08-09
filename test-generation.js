const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Test configuration - small numbers for quick testing
const TOTAL_RECORDS = 10; // Just 10 records for testing
const BATCH_SIZE = 5;

// Sample users for testing
const sampleUsers = [
  {
    firstName: 'Test',
    lastName: 'Developer',
    email: 'test.dev@company.com',
    password: 'password123',
    role: 'request'
  },
  {
    firstName: 'Test',
    lastName: 'Approver',
    email: 'test.approver@company.com',
    password: 'password123',
    role: 'approve'
  }
];

// Simple feature flag templates
const featureFlagTemplates = [
  { 
    prefix: 'ui', 
    descriptions: ['User interface improvements', 'UI enhancements'] 
  },
  { 
    prefix: 'auth', 
    descriptions: ['Authentication features', 'Security improvements'] 
  }
];

const suffixes = ['v2', 'beta', 'alpha'];

function generateRandomFlagKey(template) {
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const randomNum = Math.floor(Math.random() * 999) + 1;
  return `${template.prefix}_${suffix}_${randomNum}`;
}

function generateRandomFlagName(template) {
  const description = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${description} ${suffix}`;
}

function generateRandomDescription(template) {
  return `Enables ${template.prefix} functionality for enhanced user experience`;
}

async function createTestUsers() {
  console.log('Creating test users...');
  
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
  console.log('Fetching required data...');
  
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

async function generateTestFlags() {
  try {
    const { platforms, environments, scopes } = await getRequiredData();
    const users = await createTestUsers();
    
    console.log(`Starting generation of ${TOTAL_RECORDS} test feature flag records...`);
    
    const batch = [];
    
    for (let i = 0; i < TOTAL_RECORDS; i++) {
      const template = featureFlagTemplates[Math.floor(Math.random() * featureFlagTemplates.length)];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const environment = environments[Math.floor(Math.random() * environments.length)];
      const scope = scopes[Math.floor(Math.random() * scopes.length)];
      
      const flagKey = generateRandomFlagKey(template);
      const flagName = generateRandomFlagName(template);
      const description = generateRandomDescription(template);
      const enabled = Math.random() > 0.5;
      
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
    
    console.log(`✅ Generated ${TOTAL_RECORDS} test feature flags`);
    
    // Test change request generation
    await generateTestChangeRequests(users);
    
  } catch (error) {
    console.error('❌ Error generating test feature flags:', error);
    throw error;
  }
}

async function generateTestChangeRequests(users) {
  console.log('\n🔄 Generating test change requests...');
  
  const changeRequestUsers = users.filter(user => user.role === 'request' || user.role === 'approve');
  
  if (changeRequestUsers.length === 0) {
    console.log('⚠️  No users with request/approve roles found');
    return;
  }
  
  // Get the flags we just created
  const flags = await prisma.featureFlag.findMany({
    take: 5, // Just 5 for testing
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`Generating change requests for ${flags.length} flags...`);
  
  const changeRequestBatch = [];
  
  for (const flag of flags) {
    const requestingUser = changeRequestUsers[Math.floor(Math.random() * changeRequestUsers.length)];
    const currentValue = flag.enabled;
    const proposedValue = !currentValue;
    const status = Math.random() > 0.5 ? 'approved' : 'pending';
    
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
      requestReason: 'Test change request',
      requestedType: 'toggle',
      proposedValue: proposedValue,
      currentValue: currentValue,
      status: status,
      approvedBy: approvedBy,
      approvedAt: approvedAt,
      comment: status === 'approved' ? 'Test approval' : 'Test pending',
      flagName: flag.name,
      flagKey: flag.key,
      flagDescription: flag.description
    };
    
    changeRequestBatch.push(changeRequest);
  }
  
  await prisma.featureFlagChangeRequest.createMany({
    data: changeRequestBatch,
    skipDuplicates: true
  });
  
  console.log(`✅ Generated ${changeRequestBatch.length} test change requests`);
}

async function main() {
  try {
    console.log('🧪 Starting test generation script...');
    
    await prisma.$connect();
    console.log('✅ Database connection established');
    
    await generateTestFlags();
    
  } catch (error) {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateTestFlags };
