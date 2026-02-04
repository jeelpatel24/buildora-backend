# Railway PostgreSQL Setup Guide

## Complete Guide to Using Railway's PostgreSQL Database

This guide shows you how to set up and use Railway's cloud PostgreSQL database for both **development** and **production**.

---

## Step 1: Create Railway Account

1. Go to https://railway.app/
2. Click **"Start a New Project"** or **"Login"**
3. Sign up with GitHub (recommended - easier deployment later)
4. You'll get **$5 free credit** (no credit card needed initially)

---

## Step 2: Create PostgreSQL Database

### Option A: Create Database First (Recommended)

1. **From Railway Dashboard:**
   - Click **"New Project"**
   - Select **"Provision PostgreSQL"**
   - Railway will create a new database instance

2. **Get Your Database Credentials:**
   - Click on your PostgreSQL service
   - Go to **"Variables"** tab
   - You'll see these important variables:
     ```
     DATABASE_URL (this is the full connection string)
     PGHOST
     PGPORT
     PGUSER
     PGPASSWORD
     PGDATABASE
     ```

3. **Copy the DATABASE_URL:**
   - It looks like: `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway`
   - Copy this entire string - you'll need it!

### Option B: Create Database With Your App

1. Create a new project
2. Deploy your Node.js app (we'll do this later)
3. Then add PostgreSQL from the project

---

## Step 3: Configure Your Local Environment

1. **Open your `.env` file** in the Buildora project

2. **Replace the DATABASE_URL** with your Railway URL:
   ```env
   # Railway PostgreSQL Database
   DATABASE_URL=postgresql://postgres:YOUR_RAILWAY_PASSWORD@containers-us-west-xxx.railway.app:5432/railway
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # JWT Secret (change this to a random string)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

3. **Replace** `YOUR_RAILWAY_PASSWORD` and the host with your actual Railway credentials

---

## Step 4: Initialize Your Database Schema

Now that you're connected to Railway's PostgreSQL, you need to create your tables.

### Run the Database Setup Script:

```bash
npm run init-db
```

This will:
- Connect to your Railway PostgreSQL database
- Create the `users`, `projects`, and `proposals` tables
- Add the foreign key relationships
- Create indexes for better performance

### Verify the Setup:

```bash
npm run check-db
```

You should see:
```
✓ Database connection successful
✓ Tables created: users, projects, proposals
```

---

## Step 5: Access Railway's Database Dashboard

Railway provides a web-based database viewer:

1. **In Railway Dashboard:**
   - Click on your PostgreSQL service
   - Click **"Data"** tab
   - You can now:
     - View all tables
     - Run SQL queries
     - See data in real-time
     - Export data

2. **Example: View all users:**
   ```sql
   SELECT * FROM users;
   ```

---

## Step 6: Start Your Development Server

Now you can run your app locally, connected to Railway's database:

```bash
npm start
```

Your app will:
- Run on `http://localhost:3000`
- Connect to Railway's PostgreSQL database in the cloud
- Store all data in Railway (persistent!)

---

## Step 7: Deploy to Railway (Production)

When you're ready to deploy:

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **In Railway Dashboard:**
   - Click **"New"** → **"GitHub Repo"**
   - Select your Buildora repository
   - Railway will automatically detect it's a Node.js app

3. **Link the Database:**
   - In your app's settings
   - Go to **"Variables"**
   - Add reference to PostgreSQL:
     ```
     DATABASE_URL = ${{Postgres.DATABASE_URL}}
     ```
   - Railway will automatically use the same database!

4. **Set Environment Variables:**
   Add these in Railway's Variables:
   ```
   NODE_ENV=production
   JWT_SECRET=your-production-secret-key
   PORT=3000
   ```

5. **Deploy:**
   - Railway will automatically build and deploy
   - You'll get a live URL like: `buildora-production.up.railway.app`

---

## Step 8: Test Your Deployment

1. **Visit your Railway URL**
2. **Test the API endpoints:**
   - GET `/api/health` - Should return OK
   - POST `/api/auth/register` - Create a test user
   - GET `/api/projects` - View projects

---

## Important Notes

### Database Costs:
- Railway gives **$5 free credits/month**
- PostgreSQL uses about **$5-10/month** for small apps
- You'll need to **add a credit card** after free trial (but won't be charged if under limits)

### Connection String Format:
```
postgresql://username:password@host:port/database
```

Example:
```
postgresql://postgres:abc123xyz@containers-us-west-123.railway.app:5432/railway
```

### One Database for Everything:
- **Development:** Your local code connects to Railway
- **Production:** Your deployed app connects to Railway
- **Same database** - no syncing needed!

### Internet Required:
- You need internet to develop (cloud database)
- If internet goes down, you can't work
- Trade-off: No local installation needed

---

## Common Issues

### 1. "Connection Refused"
- Check your DATABASE_URL is correct
- Verify Railway database is running (check dashboard)
- Make sure you're connected to internet

### 2. "Password Authentication Failed"
- Copy the DATABASE_URL directly from Railway
- Don't type it manually (easy to make mistakes)

### 3. "Too Many Connections"
- Railway free tier limits connections
- Make sure you're closing connections properly
- Check `config/database.js` has `max: 5` in pool settings

### 4. Tables Not Created
- Run `npm run init-db` to create tables
- Check Railway's Data tab to verify

---

## Useful Railway Commands

### View Database in Terminal (Optional):

If you want to use command line instead of web interface:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Connect to database
railway connect postgres
```

---

## Database Backup

Railway automatically backs up your database, but you can also:

1. **Export data from Railway dashboard:**
   - Go to Data tab
   - Run: `SELECT * FROM table_name;`
   - Copy results

2. **Use pg_dump (advanced):**
   ```bash
   pg_dump $DATABASE_URL > backup.sql
   ```

---

## Next Steps

1. ✅ Railway account created
2. ✅ PostgreSQL database provisioned
3. ✅ DATABASE_URL configured in `.env`
4. ✅ Database schema initialized
5. ⬜ Start building your API endpoints
6. ⬜ Test locally
7. ⬜ Deploy to Railway
8. ⬜ Submit for grading

**You're ready to start coding! 🚀**

---

## Quick Reference

| Task | Command |
|------|---------|
| Initialize database | `npm run init-db` |
| Check database status | `npm run check-db` |
| Start dev server | `npm start` |
| Run database seed | `npm run seed` |
| View Railway dashboard | https://railway.app/dashboard |

---

## Support

- Railway Docs: https://docs.railway.app/
- Railway Discord: https://discord.gg/railway
- PostgreSQL Docs: https://www.postgresql.org/docs/

**Need help?** Check TROUBLESHOOTING.md or ask in class!
