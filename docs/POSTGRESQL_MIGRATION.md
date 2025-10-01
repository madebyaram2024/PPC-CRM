# PostgreSQL Migration Guide

This guide explains how to migrate from SQLite to PostgreSQL for production use.

## Why PostgreSQL?

SQLite is great for development but has limitations for production:
- Limited concurrent write operations
- No network access (requires file system)
- No built-in replication or backup features
- Limited scalability

PostgreSQL offers:
- Better concurrency and performance
- Network accessibility
- Advanced features (full-text search, JSON support, etc.)
- Better scaling and replication options

## Migration Steps

### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Docker:**
```bash
docker run -d \
  --name ppp-crm-postgres \
  -e POSTGRES_USER=ppp_user \
  -e POSTGRES_PASSWORD=your_secure_password \
  -e POSTGRES_DB=ppp_crm \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE ppp_crm;
CREATE USER ppp_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ppp_crm TO ppp_user;
\q
```

### 3. Update Prisma Schema

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

### 4. Update Environment Variables

Copy `.env.postgres.example` to `.env` and update:

```bash
DATABASE_URL="postgresql://ppp_user:your_secure_password@localhost:5432/ppp_crm?schema=public"
```

### 5. Migrate Data (If You Have Existing Data)

**Option A: Fresh Start (Recommended for New Deployments)**

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed
```

**Option B: Export from SQLite and Import to PostgreSQL**

```bash
# Install pgloader
brew install pgloader  # macOS
sudo apt install pgloader  # Ubuntu

# Convert SQLite to PostgreSQL
pgloader prisma/prod.db postgresql://ppp_user:password@localhost/ppp_crm
```

**Option C: Manual Export/Import**

1. Export data from SQLite:
```bash
sqlite3 prisma/prod.db .dump > backup.sql
```

2. Clean up SQLite-specific syntax
3. Import to PostgreSQL:
```bash
psql -U ppp_user -d ppp_crm -f backup.sql
```

### 6. Update Dependencies

Add PostgreSQL driver (already included in `@prisma/client`):

```bash
npm install
```

### 7. Test the Connection

```bash
# Generate Prisma client
npm run db:generate

# Test database connection
npm run dev
```

Visit `http://localhost:3400/api/health` to verify database connectivity.

### 8. Production Deployment

#### Update Docker Configuration

```dockerfile
# Dockerfile - already configured, just ensure environment variables are set
ENV DATABASE_URL="postgresql://..."
```

#### Coolify/Cloud Deployment

1. Set up PostgreSQL database in your hosting provider
2. Update environment variables with connection string
3. Run migrations during deployment:
```bash
npm run db:deploy
```

## Schema Differences

Most of the schema works identically between SQLite and PostgreSQL, but note:

### Auto-increment IDs
- SQLite: Uses `@default(cuid())`
- PostgreSQL: Uses `@default(cuid())` (same, no change needed)

### Indexes
All indexes defined in the schema work with both databases.

## Performance Optimization

### Connection Pooling

For production PostgreSQL, configure connection pooling in `src/lib/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Connection pool configuration
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

### Recommended Settings

Add to your `.env`:

```bash
# PostgreSQL connection pool settings
DATABASE_URL="postgresql://user:password@localhost:5432/ppp_crm?schema=public&connection_limit=10&pool_timeout=20"
```

## Backup and Restore

### Backup
```bash
pg_dump -U ppp_user -d ppp_crm -F c -f backup_$(date +%Y%m%d).dump
```

### Restore
```bash
pg_restore -U ppp_user -d ppp_crm -c backup_20251001.dump
```

## Troubleshooting

### Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Check connection
psql -U ppp_user -d ppp_crm -c "SELECT version();"
```

### Migration Errors

```bash
# Reset database (development only!)
npm run db:reset

# Or manually
psql -U ppp_user -d ppp_crm -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run db:migrate
```

## Rollback to SQLite

If needed, change back to SQLite:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

2. Update `.env`:
```bash
DATABASE_URL="file:./prod.db"
```

3. Regenerate client:
```bash
npm run db:generate
npm run db:migrate
```

## Resources

- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker PostgreSQL](https://hub.docker.com/_/postgres)
