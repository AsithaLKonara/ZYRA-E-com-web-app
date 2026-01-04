# Database Configuration

## Database System: PostgreSQL

This project is configured to use **PostgreSQL**, not MongoDB.

### Evidence:

1. **Prisma Schema** (`prisma/schema.prisma`):
   ```prisma
   datasource db {
     provider = "postgresql"
   }
   ```

2. **Database Connection** (`lib/db.ts`):
   - Uses `@prisma/adapter-pg` (PostgreSQL adapter)
   - Uses `pg` library (PostgreSQL driver)
   - Uses `Pool` from `pg` for connection pooling

3. **Connection Strings**:
   - Format: `postgresql://username:password@host:port/database`
   - Example: `postgresql://user:pass@localhost:5432/zyra_fashion`

4. **Database-Specific Features**:
   - Uses PostgreSQL-specific SQL queries
   - Uses `pg_stat_activity` for connection monitoring
   - Uses PostgreSQL connection pooling

### Supported Databases:

- ✅ **PostgreSQL** (Current setup)
- ❌ MongoDB (Not configured)
- ❌ MySQL (Not configured)
- ❌ SQLite (Not configured)

### To Use MongoDB Instead:

If you want to use MongoDB, you would need to:

1. Change Prisma schema:
   ```prisma
   datasource db {
     provider = "mongodb"
   }
   ```

2. Update connection strings to MongoDB format:
   ```
   mongodb://username:password@host:port/database
   ```

3. Install MongoDB adapter (if needed)
4. Update database connection code
5. Adjust schema models (MongoDB has different constraints)

**However, the current codebase is fully configured for PostgreSQL and all features are built around it.**

