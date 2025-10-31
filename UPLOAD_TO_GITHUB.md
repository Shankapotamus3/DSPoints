# Files to Upload to GitHub for Railway Deployment

Upload these files to your GitHub repository to fix the Railway deployment:

## Required Files

1. **`server/db.ts`** ✅ Updated
   - Auto-detects database type (Neon vs standard PostgreSQL)
   - Uses correct driver for Railway

2. **`scripts/seed-admin.ts`** ✅ New
   - Creates default admin user on first deployment
   - Username: admin, PIN: 1234

3. **`railway.json`** ✅ Updated
   - Runs migrations, seeding, then starts server

4. **`.nvmrc`** ✅ New
   - Specifies Node.js 20 requirement

5. **`.node-version`** ✅ New
   - Backup Node.js version specification

6. **`DEPLOYMENT.md`** ✅ Updated
   - Complete deployment instructions

## Quick Upload Steps

1. Go to your **GitHub repository** in a browser
2. Click **"Add file"** → **"Upload files"**
3. Drag all 6 files listed above
4. Commit message: **"Fix Railway deployment - add database compatibility and user seeding"**
5. Click **"Commit changes"**

## What Will Happen

Railway will automatically redeploy and you'll see in the logs:

```
📊 Using standard PostgreSQL driver
🌱 Starting admin seed...
✅ Default admin account created successfully!
   Username: admin
   PIN: 1234
✅ Server running on port 8080
```

Then you can log in at your Railway URL!

## After Login

⚠️ **IMPORTANT**: Immediately change the default PIN (1234) for security!
