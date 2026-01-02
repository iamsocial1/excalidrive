# Quick Fix - Run This Now

## The Issue
You're getting Prisma version errors because the Docker container needs to be rebuilt.

## The Fix (Copy and Paste)

Run these commands in order:

```bash
# 1. Stop containers
docker-compose down

# 2. Rebuild backend container (installs Prisma 5.x)
docker-compose build backend

# 3. Start containers
docker-compose up -d

# 4. Initialize database
docker-compose exec backend npm run db:push

# 5. Verify it works
docker-compose exec backend npm run prisma:generate
```

## Expected Output

After step 4, you should see:

```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres"...

🚀  Your database is now in sync with your Prisma schema. Done in 2.5s

✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client
```

## Verify Everything Works

```bash
# Check backend health
curl http://localhost:3001/health

# Open the app
# http://localhost:5173
```

## If You Still Get Errors

### Error: "Cannot find module '@prisma/client'"

```bash
docker-compose exec backend npm run prisma:generate
```

### Error: "Prisma schema not found"

```bash
docker-compose exec backend ls -la /app/prisma
# Should show: schema.prisma
```

If not found:
```bash
docker-compose down
docker-compose up -d
```

### Error: "Database connection failed"

Check your `backend/.env` file has the correct `DATABASE_URL` for Supabase.

## Why This Works

- `docker-compose build backend` installs all dependencies from `package.json`
- This includes Prisma 5.x (not the incompatible 7.x)
- `npm run db:push` uses the installed Prisma 5.x
- No more version conflicts!

## Alternative (If Rebuild Takes Too Long)

Install Prisma in the running container:

```bash
docker-compose exec backend npm install
docker-compose exec backend npm run db:push
```

## Next Steps

Once the database is initialized:

1. ✅ Open http://localhost:5173
2. ✅ Sign up for an account
3. ✅ Create your first drawing
4. ✅ Save it to a project

## Need More Help?

- [PRISMA_VERSION_FIX.md](PRISMA_VERSION_FIX.md) - Detailed explanation
- [HOW_TO_RUN.md](HOW_TO_RUN.md) - Complete running guide
- [DOCKER_FIX_SUMMARY.md](DOCKER_FIX_SUMMARY.md) - Docker configuration details
