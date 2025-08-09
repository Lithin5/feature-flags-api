import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config(); // Load .env variables

const prisma = new PrismaClient();

// Import the generation function
import { generateFeatureFlags } from '../generate-feature-flags';

async function main() {
  // Read from .env
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminFirstName = process.env.ADMIN_FIRSTNAME || 'System';
  const adminLastName = process.env.ADMIN_LASTNAME || 'Admin';

  const defaultPlatformName = process.env.DEFAULT_PLATFORM_NAME || 'Web';
  const defaultPlatformDescription = process.env.DEFAULT_PLATFORM_DESCRIPTION || null;

  const defaultEnvName = process.env.DEFAULT_ENV_NAME || 'Production';
  const defaultEnvDescription = process.env.DEFAULT_ENV_DESCRIPTION || null;

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
  }

  // Create admin user
  const hash = await bcrypt.hash(adminPassword, 10);
  
  try {
    // First try to find existing admin user
    let admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (admin) {
      console.log(`Admin user already exists: ${admin.email}`);
    } else {
      // Create new admin user
      admin = await prisma.user.create({
        data: {
          firstName: adminFirstName,
          lastName: adminLastName,
          email: adminEmail,
          password: hash,
          role: UserRole.admin,
        },
      });
      console.log(`Admin user created: ${admin.email}`);
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw new Error(`Failed to create admin user: ${error.message}`);
  }

  // Seed platforms
  const platforms = [
    {
      key: "mobile",
      name: "Mobile",
      description: "Native or hybrid mobile applications running on iOS or Android platforms. This includes apps built using frameworks like React Native",
      isActive: true,
    },
    {
      key: "web",
      name: "Web",
      description: "Web-based applications accessed through browsers on desktop or mobile devices",
      isActive: true,
    }
  ];

  for (const platform of platforms) {
    try {
      await prisma.platform.create({
        data: platform,
      });
      console.log(`Platform created: ${platform.name}`);
    } catch (error) {
      console.log(`Platform already exists: ${platform.name}`);
    }
  }
  console.log('Platforms seeding completed');

  // Seed environments
  const environments = [
    {
      key: "prod",
      name: "Production",
      description: "Live environment serving real users.",
      isActive: true,
    },
    {
      key: "preprod",
      name: "Pre-Production",
      description: "Stable environment that mirrors production, used for final validation before go-live.",
      isActive: true,
    },
    {
      key: "uat",
      name: "Staging",
      description: "Environment for business stakeholders to validate features before release.",
      isActive: true,
    },
    {
      key: "sit",
      name: "SIT",
      description: "Environment for testing end-to-end integration between multiple systems or services.",
      isActive: true,
    },
    {
      key: "dev",
      name: "DEV",
      description: "Used by developers for writing and testing code in an isolated environment. It typically includes debugging tools and unstable builds. Changes are frequent and unvalidated.",
      isActive: true,
    }
  ];

  for (const environment of environments) {
    try {
      await prisma.environment.create({
        data: environment,
      });
      console.log(`Environment created: ${environment.name}`);
    } catch (error) {
      console.log(`Environment already exists: ${environment.name}`);
    }
  }
  console.log('Environments seeding completed');

  // Seed scopes
  const scopes = [
    {
      name: "Users",
      slug: "users",
      description: "Account management, authentication",
      isActive: true
    },
    {
      name: "Payments",
      slug: "payments",
      description: "checkout, billing, invoicing",
      isActive: true
    },
    {
      name: "Reports",
      slug: "reports",
      description: "analytics, reporting, and data exports",
      isActive: true
    },
    {
      name: "General",
      slug: "general",
      description: "core features affecting multiple areas",
      isActive: true
    }
  ];

  for (const scope of scopes) {
    try {
      await prisma.featureFlagScope.create({
        data: scope,
      });
      console.log(`Scope created: ${scope.name}`);
    } catch (error) {
      console.log(`Scope already exists: ${scope.name}`);
    }
  }
  console.log('Scopes seeding completed');

  // Check if we should generate feature flags
  const shouldGenerateFlags = process.env.GENERATE_FLAGS === 'true';
  
  if (shouldGenerateFlags) {
    console.log('\n🚀 Starting feature flag generation...');
    try {
      await generateFeatureFlags();
      console.log('✅ Feature flag generation completed successfully!');
    } catch (error) {
      console.error('❌ Feature flag generation failed:', error);
      // Don't throw error to avoid failing the entire seed process
    }
  } else {
    console.log('\n💡 To generate feature flags, run: npm run db:generate');
    console.log('💡 Or set GENERATE_FLAGS=true and run: npm run db:seed');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
