# 🚀 DEPLOY TO RAILWAY - Complete Guide

## Your Project is Ready for Railway Deployment!

Your Buildora backend is fully configured for Railway. Here's how to deploy it now:

---

## STEP 1: Push Code to GitHub

Railway deploys directly from GitHub, so first push your code:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Buildora API ready for Railway deployment"

# Create repository on GitHub (if needed) then:
git remote add origin https://github.com/YOUR_USERNAME/buildora.git
git branch -M main
git push -u origin main
```

---

## STEP 2: Create Railway Project

1. Go to https://railway.app
2. Sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your buildora repository
6. Wait for Railway to detect Node.js and create the project

---

## STEP 3: Add PostgreSQL Database

1. In your Railway project, click **"Add Service"**
2. Select **"Provision PostgreSQL"**
3. Railway will create a new PostgreSQL database
4. The `DATABASE_URL` environment variable will be auto-created

---

## STEP 4: Configure Environment Variables

1. In Railway dashboard, go to your **Node.js service**
2. Click **"Variables"** tab
3. Add these variables:
   ```
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xYz1234567890
   ```
4. **DATABASE_URL is auto-linked from PostgreSQL service** (no need to add manually)

---

## STEP 5: Deploy

1. Push any final changes to GitHub
2. Railway will auto-deploy when it detects changes
3. Wait for the build to complete (takes 2-3 minutes)
4. You'll see a green checkmark when deployment is done

---

## STEP 6: Database Initialization

Railway's **Procfile** will auto-run:
```
release: node scripts/initDatabase.js
web: node server.js
```

This means:
- **Before** starting the server, it runs `initDatabase.js`
- This creates all tables and seeds the admin user
- Then the web server starts

✅ **Your admin user will be created automatically:**
- Email: `admin@buildora.com`
- Password: `admin123`

---

## ✅ Verify Deployment

1. Railway will show you a URL like: `https://buildora-production.railway.app`
2. Test the health endpoint:
   ```
   GET https://buildora-production.railway.app/
   ```
3. You should get:
   ```json
   {
     "message": "Buildora API is running",
     "version": "1.0.0",
     "endpoints": {...}
   }
   ```

---

## 🔗 Useful Links

- **Railway Dashboard:** https://railway.app/dashboard
- **Your Project Logs:** Click service → "Logs" tab
- **Environment Variables:** Service → "Variables" tab
- **Deployment Status:** Service → "Deployments" tab

---

## 🆘 Troubleshooting

### Build Failed
- Check **Logs** tab in Railway dashboard
- Ensure all dependencies in `package.json` are correct
- Make sure `server.js` is in root directory

### Database Connection Error
- Verify PostgreSQL service is added to project
- Check that `DATABASE_URL` is set in variables
- Railway's `postgres.railway.internal` hostname only works within their network

### Server Won't Start
- Check **Logs** tab for error messages
- Verify `JWT_SECRET` is set in variables
- Ensure `PORT` environment variable is recognized

---

## 📝 What Gets Auto-Created on First Deploy

1. ✅ PostgreSQL database tables
   - `users` table
   - `projects` table  
   - `proposals` table
   - Indexes for performance

2. ✅ Sample admin user
   - Email: admin@buildora.com
   - Password: admin123

3. ✅ Express server listening on Railway's assigned PORT

---

## 🎉 You're Done!

Your Buildora backend is now live on Railway and ready to receive API requests!

**Next Steps:**
- Test API endpoints with Postman
- Deploy your frontend
- Share the API URL with your frontend team

Your production API URL will be shown in the Railway dashboard.
