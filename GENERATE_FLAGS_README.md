# Feature Flag Generation Script

This script generates 5000 meaningful feature flag records in the database for testing and performance evaluation purposes, along with sample users and change request entries.

## Prerequisites

1. **Database Setup**: Ensure your database is running and accessible
2. **Environment Variables**: Make sure your `.env` file contains the `DATABASE_URL`
3. **Database Schema**: The database tables need to be created before seeding

## Setup Steps

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Create database schema** (choose one option):
   
   **Option A: Using Prisma Push (Recommended for development)**
   ```bash
   npm run db:push
   ```
   
   **Option B: Using Prisma Migrate (For production)**
   ```bash
   npm run db:migrate
   ```

3. **Verify database connection** by checking your `.env` file has the correct `DATABASE_URL`

## Available Scripts

The following npm scripts are available for database operations:

- `npm run db:push` - Create database schema using Prisma push (development)
- `npm run db:migrate` - Create database schema using Prisma migrate (production)
- `npm run db:seed` - Run the basic seed script (platforms, environments, scopes, admin user)
- `npm run db:generate` - Generate 5000 feature flags and change requests
- `npm run db:generate:test` - Generate 10 test feature flags for quick testing
- `npm run db:setup` - Create schema, seed data, then generate feature flags
- `npm run db:setup:with-flags` - Create schema and seed with feature flag generation enabled
- `npm run db:reset` - Reset database (drops all data and recreates schema)
- `npm run db:reset:safe` - Safe reset with confirmation prompt

## Usage

### 🚀 Quick Start (Recommended)
```bash
# Complete setup with database schema creation and feature flags
npm run db:setup:full
```

### 🔧 Step-by-Step Setup
```bash
# 1. Create database schema and seed basic data
npm run db:setup:quick

# 2. Generate feature flags (optional)
npm run db:generate
```

### 📋 Alternative Commands

#### Option 1: All-in-One Setup
```bash
npm run db:setup:with-flags
```

#### Option 2: Manual Setup
```bash
# Create database schema
npm run db:push

# Seed basic data
npm run db:seed

# Generate feature flags
npm run db:generate
```

#### Option 3: Direct Script Execution
```bash
# TypeScript version
npx ts-node generate-feature-flags.ts

# JavaScript version
node generate-feature-flags-test.js
```

#### Option 4: Setup Script
```bash
# Quick setup (schema + seed)
node setup-database.js quick

# Full setup (schema + seed + flags)
node setup-database.js full

# Reset database (DANGER: drops all data)
node setup-database.js reset
```

### What the Script Does

1. **Creates Sample Users**: Generates 8 sample users with different roles:
   - John Developer (request role)
   - Sarah Product Manager (approve role)
   - Mike QA Engineer (request role)
   - Lisa DevOps Engineer (approve role)
   - David Frontend Developer (request role)
   - Emma Backend Developer (request role)
   - Alex UI/UX Designer (view role)
   - Rachel Data Analyst (request role)

2. **Generates Feature Flags**: Creates 5000 meaningful feature flags with:
   - 10 different categories (ui, auth, payment, analytics, notification, search, api, performance, integration, compliance)
   - Realistic flag keys (e.g., `ui_v2_1234`, `auth_beta_5678`)
   - Descriptive names and descriptions
   - Random enabled/disabled status (40% enabled, 60% disabled)
   - Proper relationships to platforms, environments, and scopes

3. **Creates Change Requests**: Generates change request entries for approximately 20% of the flags:
   - Mix of pending and approved requests
   - Realistic request reasons
   - Proper user assignments based on roles
   - Audit trail information

### Configuration Options

You can modify the following constants in the script:

- `TOTAL_RECORDS`: Number of records to generate (default: 5,000)
- `BATCH_SIZE`: Number of records to process in each batch (default: 100)
- `LOG_INTERVAL`: How often to log progress (default: 100 records)

### Example with Custom Configuration

```javascript
// Modify these values in generate-feature-flags-test.js
const TOTAL_RECORDS = 10000; // Generate 10k records instead
const BATCH_SIZE = 200; // Larger batches for faster systems
const LOG_INTERVAL = 500; // Log every 500 records
```

## Generated Data Structure

### Feature Flag Categories
- **UI**: User interface improvements, responsive design, accessibility
- **Auth**: Authentication, security, SSO, OAuth
- **Payment**: Payment processing, billing, subscriptions
- **Analytics**: Data analytics, reporting, metrics
- **Notification**: User notifications, alerts, messaging
- **Search**: Search functionality, filtering, autocomplete
- **API**: API endpoints, rate limiting, versioning
- **Performance**: Optimizations, caching, CDN
- **Integration**: Third-party integrations, CRM, marketing tools
- **Compliance**: GDPR, data privacy, audit logging

### Change Request Types
- **Pending**: 70% of change requests
- **Approved**: 30% of change requests
- **Reasons**: Feature rollout, performance improvements, security enhancements, etc.

## Performance Notes

- The script processes records in batches for optimal performance
- Progress is logged every 100 records by default
- Estimated completion time and rate are displayed
- Database connections are properly managed

## Troubleshooting

### Common Issues

1. **"Table does not exist" Error**
   ```bash
   # Solution: Create database schema first
   npm run db:push
   ```

2. **Database Connection Issues**
   - Check your `DATABASE_URL` in `.env`
   - Ensure database server is running
   - Verify database credentials

3. **Missing Dependencies**
   ```bash
   npm install
   ```

4. **Permission Issues**
   - Ensure your database user has CREATE/INSERT permissions
   - For PostgreSQL: `GRANT ALL PRIVILEGES ON DATABASE your_db TO your_user;`

5. **Memory Issues**
   - Reduce `BATCH_SIZE` in the generation script
   - Close other applications to free up memory

6. **Reset Database (if needed)**
   ```bash
   # Safe reset with confirmation
   npm run db:reset:safe
   
   # Force reset (no confirmation)
   npm run db:reset
   
   # Using setup script
   node setup-database.js reset
   ```

### Environment Variables

Make sure your `.env` file contains:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
ADMIN_EMAIL="admin@company.com"
ADMIN_PASSWORD="your_admin_password"
```

## Sample Output

```
🧪 Starting feature flag generation script...
✅ Database connection established
Creating sample users for change requests...
Created user: John Developer (john.developer@company.com)
Created user: Sarah Product Manager (sarah.pm@company.com)
...
Fetching required data (platforms, environments, scopes)...
Found 2 platforms, 5 environments, 4 scopes
Starting generation of 5,000 feature flag records...
Processing in batches of 100 records
Progress: 100/5,000 records (2%)
Rate: 50 records/sec, ETA: 98 seconds
...
✅ Feature flag generation completed!
📊 Total records generated: 5,000
⏱️  Total time: 95 seconds
🚀 Average rate: 53 records/second

🔄 Generating change requests...
Fetching 1000 random flags for change requests...
Generating change requests for 1000 flags...
✅ Generated 1000 change requests
🔌 Database connection closed
```
