# 🗃️ Alembic Migration Guide - ZYNIQ-CREW7

**Complete guide to database migrations using Alembic**

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Why Alembic?](#why-alembic)
3. [Project Setup](#project-setup)
4. [Migration Commands](#migration-commands)
5. [Development Workflow](#development-workflow)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Overview

ZYNIQ-CREW7 uses **Alembic 1.17.2** for database schema management. All migrations are auto-generated from SQLAlchemy models and version-controlled in Git.

### Key Benefits

- ✅ **Code-first approach** - Models define schema, migrations auto-generated
- ✅ **Version tracking** - Every schema change is versioned and tracked
- ✅ **Rollback support** - Can upgrade/downgrade to any version
- ✅ **Team collaboration** - Conflicts resolved like code conflicts
- ✅ **Production-safe** - Test locally before deploying
- ✅ **Automatic application** - `start.sh` runs migrations on startup

---

## Why Alembic?

### Old Approach: Raw SQL Files

```sql
-- migrations/20251116_add_agents.sql
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY,
    crew_id UUID REFERENCES crews(id),
    ...
);
```

**Problems:**
- ❌ Manual SQL writing (error-prone)
- ❌ No version tracking
- ❌ Can't rollback
- ❌ Duplicate errors on re-run
- ❌ Hard to review changes
- ❌ Doesn't validate against models

### New Approach: Alembic

```python
# alembic/versions/xxxxx_add_agents.py
def upgrade():
    op.create_table('agents',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('crew_id', sa.UUID(), nullable=False),
        ...
        sa.ForeignKeyConstraint(['crew_id'], ['crews.id']),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('agents')
```

**Benefits:**
- ✅ Auto-generated from models
- ✅ Version tracked in Git
- ✅ Rollback with `downgrade()`
- ✅ Validates against SQLAlchemy
- ✅ Easy to review in PRs
- ✅ Production-ready

---

## Project Setup

### Directory Structure

```
backend/
├── alembic/
│   ├── versions/                      # Migration files
│   │   └── c97d607f592c_initial_migration.py
│   ├── env.py                         # Alembic environment
│   └── script.py.mako                 # Migration template
├── alembic.ini                        # Alembic configuration
├── db-migrate.sh                      # Helper script
└── app/
    ├── models/                        # SQLAlchemy models
    │   ├── user.py
    │   ├── crew.py
    │   └── ...
    └── infra/
        └── db.py                      # Base class
```

### Configuration Files

**alembic.ini:**
```ini
[alembic]
script_location = alembic
# Database URL loaded from settings.DB_URL at runtime
```

**alembic/env.py:**
```python
from app.infra.db import Base
import app.models  # Import all models

target_metadata = Base.metadata  # Auto-detect schema

# Reads DB_URL from app.config.settings
```

### Initial Migration

The project includes one initial migration with:
- 15 tables (users, wallets, crews, agents, runs, etc.)
- 3 enum types (runstatus, chaintype, transactiondirection)
- Indexes for performance
- Foreign key relationships

**Migration ID:** `c97d607f592c`

---

## Migration Commands

### Using the Helper Script

The `db-migrate.sh` script simplifies common operations:

```bash
cd backend

# Check current migration version
./db-migrate.sh current

# View migration history
./db-migrate.sh history

# Apply all pending migrations
./db-migrate.sh upgrade

# Create new migration
./db-migrate.sh create "add user preferences"

# Rollback last migration
./db-migrate.sh downgrade

# Stamp database (mark as migrated without running)
./db-migrate.sh stamp head
```

### Direct Alembic Commands

```bash
cd backend

# Apply all pending migrations
uv run alembic upgrade head

# Upgrade to specific revision
uv run alembic upgrade c97d607f592c

# Downgrade to specific revision
uv run alembic downgrade c97d607f592c

# Show current version
uv run alembic current

# Show migration history
uv run alembic history --verbose

# Create new migration (auto-generate)
uv run alembic revision --autogenerate -m "your message"

# Create empty migration (manual)
uv run alembic revision -m "your message"
```

### In Docker Container

```bash
# Apply migrations
docker compose -f backend/docker/compose.yml exec api alembic upgrade head

# Check current version
docker compose -f backend/docker/compose.yml exec api alembic current

# View history
docker compose -f backend/docker/compose.yml exec api alembic history
```

---

## Development Workflow

### Step-by-Step: Adding a New Model

**1. Create/Modify Model**

```python
# backend/app/models/notification.py
from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.infra.db import Base

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    message = Column(String(500), nullable=False)
    read = Column(Boolean, default=False)
```

**2. Import Model in `app/models/__init__.py`**

```python
from .notification import Notification  # Add this line
```

**3. Generate Migration**

```bash
cd backend
./db-migrate.sh create "add notifications table"
```

Output:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.autogenerate.compare] Detected added table 'notifications'
  Generating /app/alembic/versions/xxxxx_add_notifications_table.py ...  done
```

**4. Review Generated Migration**

```bash
cat alembic/versions/xxxxx_add_notifications_table.py
```

Check:
- ✅ Table name correct
- ✅ Columns match model
- ✅ Foreign keys created
- ✅ Indexes added if needed
- ✅ `downgrade()` drops table

**5. Test Migration Locally**

```bash
# Apply migration
./db-migrate.sh upgrade

# Verify table exists
docker compose -f docker/compose.yml exec -T db psql -U crew7 -d crew7 -c "\d+ notifications"

# Test downgrade (rollback)
./db-migrate.sh downgrade

# Re-apply
./db-migrate.sh upgrade
```

**6. Commit to Git**

```bash
git add app/models/notification.py
git add app/models/__init__.py
git add alembic/versions/xxxxx_add_notifications_table.py
git commit -m "Add notifications model and migration"
```

### Step-by-Step: Modifying Existing Model

**1. Update Model**

```python
# backend/app/models/user.py
class User(Base):
    __tablename__ = "users"
    
    # ... existing columns ...
    
    # Add new column
    is_verified = Column(Boolean, default=False)  # NEW
```

**2. Generate Migration**

```bash
./db-migrate.sh create "add is_verified to users"
```

**3. Review Migration**

```python
# alembic/versions/xxxxx_add_is_verified_to_users.py
def upgrade():
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), 
                                      server_default='false', nullable=False))

def downgrade():
    op.drop_column('users', 'is_verified')
```

**4. Test Migration**

```bash
# Apply
./db-migrate.sh upgrade

# Check column exists
docker compose -f docker/compose.yml exec -T db psql -U crew7 -d crew7 \
  -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' AND column_name='is_verified';"
```

**5. Commit**

```bash
git add app/models/user.py
git add alembic/versions/xxxxx_add_is_verified_to_users.py
git commit -m "Add is_verified flag to users"
```

---

## Production Deployment

### Pre-Deployment Checklist

- ✅ All migrations tested locally
- ✅ Downgrade tested (rollback works)
- ✅ No data loss in migrations
- ✅ Indexes added for new queries
- ✅ Foreign keys validated
- ✅ Default values set for new columns
- ✅ Migration reviewed by team

### Deployment Process

**1. Deploy Code**

```bash
# Pull latest code
git pull origin main

# Rebuild containers
docker compose build
```

**2. Apply Migrations**

```bash
# Check current version
docker compose exec api alembic current

# Show pending migrations
docker compose exec api alembic history

# Apply migrations
docker compose exec api alembic upgrade head
```

**3. Verify Application**

```bash
# Check logs
docker compose logs -f api

# Test API
curl http://localhost:8000/health
```

**4. Rollback if Needed**

```bash
# Downgrade to previous version
docker compose exec api alembic downgrade -1

# Downgrade to specific version
docker compose exec api alembic downgrade c97d607f592c
```

### Zero-Downtime Migrations

For large tables or critical systems:

**1. Backward-Compatible Migrations**

Add column as nullable first:
```python
def upgrade():
    # Step 1: Add column (nullable)
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=True))
    
    # Step 2: Set default values
    op.execute("UPDATE users SET email_verified = false WHERE email_verified IS NULL")
    
    # Step 3: Make not nullable (in future migration)
    # op.alter_column('users', 'email_verified', nullable=False)
```

**2. Multi-Phase Deployment**

- Phase 1: Deploy code that works with/without new column
- Phase 2: Run migration
- Phase 3: Deploy code that uses new column

---

## Troubleshooting

### Issue: Migration Already Applied

**Error:**
```
sqlalchemy.exc.ProgrammingError: (psycopg.errors.DuplicateObject) 
type "runstatus" already exists
```

**Solution 1: Stamp Database**
```bash
# Mark current state as migrated
./db-migrate.sh stamp head
```

**Solution 2: Fresh Start** (⚠️ Deletes data)
```bash
docker compose down -v
./start.sh
```

### Issue: Migration Conflicts

**Error:**
```
FAILED: Multiple head revisions are present
```

**Solution:**
```bash
# View heads
uv run alembic heads

# Merge branches
uv run alembic merge -m "merge migrations" head1 head2

# Apply merge
./db-migrate.sh upgrade
```

### Issue: Can't Auto-Generate Changes

**Problem:** Alembic doesn't detect model changes

**Solutions:**

1. **Ensure model is imported:**
```python
# app/models/__init__.py
from .new_model import NewModel  # Must be imported!
```

2. **Check Base class:**
```python
from app.infra.db import Base  # Correct
from sqlalchemy.ext.declarative import declarative_base  # Wrong!
```

3. **Restart API container:**
```bash
docker compose restart api
```

### Issue: Foreign Key Constraint Error

**Error:**
```
FOREIGN KEY constraint failed
```

**Solution:** Add data migration:
```python
def upgrade():
    # Create table
    op.create_table('new_table', ...)
    
    # Create missing references first
    op.execute("""
        INSERT INTO parent_table (id) 
        SELECT DISTINCT parent_id FROM temp_data 
        WHERE parent_id NOT IN (SELECT id FROM parent_table)
    """)
```

---

## Best Practices

### DO ✅

1. **Always review generated migrations**
   ```bash
   cat alembic/versions/xxxxx_new_migration.py
   ```

2. **Test upgrade AND downgrade**
   ```bash
   ./db-migrate.sh upgrade
   ./db-migrate.sh downgrade
   ./db-migrate.sh upgrade  # Should work again
   ```

3. **Add indexes for foreign keys**
   ```python
   op.create_index('idx_crew_id', 'agents', ['crew_id'])
   ```

4. **Set default values for new columns**
   ```python
   op.add_column('users', sa.Column('role', sa.String(), 
                                     server_default='member'))
   ```

5. **Use descriptive migration messages**
   ```bash
   ./db-migrate.sh create "add email verification to users"  # Good
   ./db-migrate.sh create "update"  # Bad
   ```

6. **Commit migrations with code changes**
   ```bash
   git add app/models/ alembic/versions/
   git commit -m "Add notification system"
   ```

### DON'T ❌

1. **Don't edit applied migrations**
   - Create new migration instead
   - Or use `stamp` to reset version

2. **Don't skip migrations**
   ```bash
   # Don't do this in production:
   docker compose down -v  # Skips migration history
   ```

3. **Don't ignore migration errors**
   - Fix immediately
   - Test rollback works

4. **Don't forget data migrations**
   ```python
   # Bad: Just add NOT NULL column
   op.add_column('users', sa.Column('email', sa.String(), nullable=False))
   
   # Good: Add nullable, populate, then make NOT NULL
   op.add_column('users', sa.Column('email', sa.String(), nullable=True))
   op.execute("UPDATE users SET email = username || '@example.com'")
   op.alter_column('users', 'email', nullable=False)
   ```

5. **Don't commit merge conflicts**
   - Resolve carefully
   - Test thoroughly

---

## Integration with start.sh

The `start.sh` script automatically applies migrations:

```bash
# Step 6.5 in start.sh
echo "  → Applying Alembic migrations"
docker-compose exec -T api alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✓ Migrations applied successfully"
else
    echo "✗ Migration failed!"
    exit 1
fi
```

This ensures:
1. Database schema always matches code
2. New developers get correct schema
3. Production deployments are consistent
4. No manual SQL execution needed

---

## Summary

### Key Takeaways

1. **Alembic manages all schema changes** - No manual SQL needed
2. **Migrations are code** - Version controlled, reviewable, testable
3. **Auto-generation works well** - Review but don't write manually
4. **Rollback support** - Can undo any migration
5. **Production-safe** - Test locally, deploy with confidence

### Quick Reference

```bash
# Common commands
./db-migrate.sh current     # Check version
./db-migrate.sh history     # View all migrations
./db-migrate.sh upgrade     # Apply migrations
./db-migrate.sh create "msg" # New migration
./db-migrate.sh downgrade   # Rollback

# Emergency reset (⚠️ deletes data)
docker compose down -v
./start.sh
```

### Further Reading

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- Backend Alembic Setup: `backend/ALEMBIC_SETUP.md`
- Start Script Guide: `START_SCRIPT_SUMMARY.md`

---

**Questions?** Check `backend/ALEMBIC_SETUP.md` or review migration files in `backend/alembic/versions/`
