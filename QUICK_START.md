# Buildora Quick Start Guide

Get Buildora running in 5 minutes using Railway PostgreSQL!

## Prerequisites Check

Before starting, make sure you have:
- [ ] Node.js installed (v14 or higher) - Run `node --version`
- [ ] Railway account created - https://railway.app/
- [ ] Internet connection (for cloud database)
- [ ] Git installed (for deployment)

**NO LOCAL POSTGRESQL NEEDED!** ✨

---

## Step 1: Create Railway PostgreSQL Database (2 minutes)

1. **Go to Railway**: https://railway.app/
2. **Login/Sign up** with GitHub
3. **Click** "New Project"
4. **Select** "Provision PostgreSQL"
5. **Click** on the PostgreSQL service
6. **Go to** "Variables" tab
7. **Copy** the `DATABASE_URL` value

It looks like:
```
postgresql://postgres:abc123xyz@containers-us-west-123.railway.app:5432/railway
```

---

## Step 2: Install Dependencies (1 minute)

Open terminal in project directory:
```bash
cd "C:\Users\jeelp\Documents\Sem_4\Prog2500 Full Stack\Buildora"
npm install
```

Wait for all packages to install...

---

## Step 3: Configure Environment (1 minute)

### Create .env File

Create a file named `.env` in the project root:

```env
PORT=3000
DATABASE_URL=your-railway-database-url-paste-here
JWT_SECRET=aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xYz
NODE_ENV=development
```

**IMPORTANT:** Replace `your-railway-database-url-paste-here` with the actual DATABASE_URL you copied from Railway!

Example:
```env
DATABASE_URL=postgresql://postgres:abc123xyz@containers-us-west-123.railway.app:5432/railway
```

---

## Step 4: Initialize Database (1 minute)

Run the database initialization script:
```bash
npm run init-db
```

You should see:
```
✓ Dropped existing tables
✓ Created users table
✓ Created projects table
✓ Created proposals table
✓ Created indexes
✓ Created admin user
✓ Database initialization completed successfully!
```

This creates all tables in your Railway PostgreSQL database!

---

## Step 5: Start Server (30 seconds)

```bash
npm run dev
```

You should see:
```
=================================
  Buildora Backend Server
=================================
✓ Server running on port 3000
✓ Environment: development
✓ API Base URL: http://localhost:3000
✓ Connected to PostgreSQL database
=================================
```

Your local server is now running and connected to Railway's cloud database! 🎉

---

## Step 6: Test It! (30 seconds)

### Test 1: Check API is Running
Open browser and go to:
```
http://localhost:3000
```

You should see:
```json
{
  "message": "Buildora API is running",
  "version": "1.0.0"
}
```

### Test 2: Login as Admin
Use Postman or curl:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@buildora.com\",\"password\":\"admin123\"}"
```

You should get back a JWT token!

---

## Common Issues & Quick Fixes

### Issue: "Connection refused" or "Cannot connect to database"
**Fix**: 
1. Check your DATABASE_URL in .env is correct (copy directly from Railway)
2. Make sure you have internet connection
3. Verify Railway database is running (check Railway dashboard)

### Issue: "Module not found"
**Fix**: Run `npm install` again

### Issue: "Port 3000 already in use"
**Fix**: Change PORT in .env to 3001 or kill the process using port 3000

### Issue: "JWT_SECRET is not defined"
**Fix**: Make sure .env file exists and has JWT_SECRET

### Issue: "Password authentication failed"
**Fix**: Don't type DATABASE_URL manually - copy/paste it directly from Railway

---

## Railway Database Dashboard

You can view your data in Railway:

1. Go to Railway dashboard
2. Click on your PostgreSQL service
3. Click **"Data"** tab
4. You can now:
   - View all tables
   - Run SQL queries
   - See real-time data
   - Export data

Example query:
```sql
SELECT * FROM users;
```

---

## Default Credentials

**Admin Account** (created during init-db):
- Email: `admin@buildora.com`
- Password: `admin123`

---

## Next Steps

1. **Read Railway Setup Guide**
   - See `RAILWAY_SETUP.md` for complete Railway documentation

2. **Import Postman Collection**
   - File: `Buildora_API.postman_collection.json`
   - Import into Postman
   - Update `base_url` variable to `http://localhost:3000`

3. **Read the Documentation**
   - `API_DOCUMENTATION.md` - All API endpoints
   - `TESTING_GUIDE.md` - Complete testing scenarios
   - `PRESENTATION_GUIDE.md` - How to present your work

4. **Create Test Data**
   - Register homeowners
   - Register contractors
   - Create projects
   - Submit proposals

5. **Deploy for Presentation**
   - See `DEPLOYMENT.md` for Railway deployment
   - Get your public URL
   - Test live deployment

---

## Quick Command Reference

```bash
# Install dependencies
npm install

# Initialize database (creates tables in Railway)
npm run init-db

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Check if server is running
curl http://localhost:3000
```

---

## File Structure Overview

```
Buildora/
├── config/
│   └── database.js              ← PostgreSQL connection (Railway)
├── middleware/
│   └── auth.js                  ← JWT & role verification
├── routes/
│   ├── auth.js                  ← Register/Login
│   ├── projects.js              ← Project CRUD
│   ├── proposals.js             ← Proposal management
│   └── admin.js                 ← Admin functions
├── scripts/
│   └── initDatabase.js          ← Database setup script
├── server.js                    ← Main entry point
├── package.json                 ← Dependencies
├── .env                         ← Your configuration (Railway URL)
└── README.md                    ← Project overview
```

---

## Test Workflow Example

1. **Register Homeowner**
   ```
   POST /api/auth/register
   → Save token
   ```

2. **Create Project**
   ```
   POST /api/projects (with homeowner token)
   → Note project_id
   ```

3. **Register Contractor**
   ```
   POST /api/auth/register
   → Save token
   ```

4. **Browse Projects**
   ```
   GET /api/projects (with contractor token)
   ```

5. **Submit Proposal**
   ```
   POST /api/proposals (with contractor token)
   → Note proposal_id
   ```

6. **Accept Proposal**
   ```
   PUT /api/proposals/:id/accept (with homeowner token)
   ```

---

## Benefits of Railway PostgreSQL

✅ **No Local Installation** - No PostgreSQL setup needed  
✅ **Same Database** - Dev & production use the same database  
✅ **Cloud Backup** - Automatic backups  
✅ **Easy Deployment** - One-click deploy  
✅ **Web Dashboard** - View data in browser  
✅ **Free Tier** - $5/month credit included  

---

## Ready to Present?

Checklist:
- [ ] Railway account created
- [ ] PostgreSQL database provisioned
- [ ] DATABASE_URL configured in .env
- [ ] Database initialized successfully
- [ ] Server starts without errors
- [ ] Can register users
- [ ] Can create projects
- [ ] Can submit proposals
- [ ] Can accept proposals
- [ ] Admin login works
- [ ] Code pushed to GitHub
- [ ] Deployed to Railway
- [ ] Live URL works

**You're all set! Good luck with your presentation! 🚀**

---

## Need Help?

- Check `RAILWAY_SETUP.md` for Railway-specific help
- Check `TESTING_GUIDE.md` for detailed scenarios
- Review `API_DOCUMENTATION.md` for endpoint details
- See `PRESENTATION_GUIDE.md` for demo tips
- Look at error messages in terminal

## Important Notes

⚠️ **Internet Required**: You need internet connection to work (cloud database)  
💰 **Free Tier**: Railway gives $5/month free credit  
🔄 **One Database**: Same database for development AND production  
📊 **Dashboard**: Use Railway's web interface to view data  

## Support

If you encounter issues:
1. Read the error message carefully
2. Check your .env configuration (DATABASE_URL must be exact)
3. Verify Railway database is running (Railway dashboard)
4. Ensure you have internet connection
5. Review `RAILWAY_SETUP.md` for detailed Railway help
6. Check `TROUBLESHOOTING.md`
