# ✅ RAILWAY DEPLOYMENT CHECKLIST

## Pre-Deployment Verification

### Project Structure ✓
- [x] `server.js` - Main server file
- [x] `config/database.js` - Database configuration
- [x] `routes/` - All API routes (auth, projects, proposals, admin)
- [x] `middleware/auth.js` - Authentication middleware
- [x] `scripts/initDatabase.js` - Database initialization
- [x] `package.json` - All dependencies listed
- [x] `Procfile` - Release and web processes configured
- [x] `.env` - Environment variables set

### Configuration ✓
- [x] `NODE_ENV=production` set in .env
- [x] `PORT=3000` configured
- [x] `JWT_SECRET` configured
- [x] `DATABASE_URL` set to Railway PostgreSQL
- [x] All npm dependencies installed

### Code Quality ✓
- [x] No compilation errors
- [x] All routes properly configured
- [x] Error handling implemented
- [x] Graceful shutdown configured
- [x] CORS enabled for frontend communication
- [x] Request logging enabled

---

## Railway Deployment Steps

### Step 1: Push to GitHub
```bash
cd c:\Users\jeelp\Documents\Sem_4\Prog2500\ Full\ Stack\Buildora
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### Step 2: Create Railway Account
- Visit https://railway.app
- Sign up with GitHub
- Accept the permissions

### Step 3: Deploy Node.js App
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your buildora repository
4. Railway auto-detects Node.js configuration

### Step 4: Add PostgreSQL Database
1. In Railway project dashboard
2. Click "Add Service"
3. Select "Provision PostgreSQL"
4. Wait for database to be created

### Step 5: Verify Deployment
1. Check railway.app/dashboard for your app
2. Click on Node.js service → Logs
3. Should see "Server running on port 3000"
4. Database tables should be created automatically

---

## What Happens on First Deploy

```
1. Railway detects Node.js project
2. Installs dependencies (npm install)
3. Runs release command: node scripts/initDatabase.js
   - Connects to PostgreSQL
   - Creates all tables
   - Creates admin user (admin@buildora.com / admin123)
   - Creates indexes
4. Starts web process: node server.js
5. Server listens on assigned PORT
6. API is now live!
```

---

## Testing After Deployment

### Test Health Endpoint
```bash
curl https://your-app.railway.app/
# Should return: {"message": "Buildora API is running", ...}
```

### Test Admin Login
```bash
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@buildora.com",
    "password": "admin123"
  }'
# Should return: {"token": "jwt_token_here", ...}
```

### Check Database Tables
In Railway dashboard:
1. Click PostgreSQL service
2. Click "Data" tab
3. Should see: users, projects, proposals tables

---

## Key Environment Variables on Railway

### Auto-Created by Railway
- `DATABASE_URL` - Connection string from PostgreSQL service

### You Set These
- `NODE_ENV=production`
- `PORT=3000`
- `JWT_SECRET=aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xYz1234567890`

---

## Monitoring After Deployment

### View Logs
Railway Dashboard → Your Node.js Service → Logs tab

### Monitor Database
Railway Dashboard → PostgreSQL Service → Data tab

### Check Deployments
Railway Dashboard → Deployments tab

---

## Common Issues & Solutions

### Issue: Build Failed
**Solution:** Check Logs tab for error details. Ensure:
- All dependencies in package.json
- Node version compatible
- server.js exists in root

### Issue: Can't Connect to Database
**Solution:** 
- Verify PostgreSQL service added to project
- Check DATABASE_URL in variables
- Wait 30s after adding service

### Issue: 502 Bad Gateway
**Solution:**
- Check server logs for errors
- Verify PORT is being read correctly
- Check DATABASE_URL is set

### Issue: Database Tables Not Created
**Solution:**
- Check deployment Logs for initDatabase.js output
- Verify PostgreSQL service is healthy
- Re-run release process if needed

---

## Your Production API URL

Once deployed, Railway will show your live URL:
```
https://buildora-production-xxxxx.railway.app
```

Share this URL with your:
- Frontend team (for API requests)
- QA team (for testing)
- Clients/Stakeholders

---

## Next Steps

1. ✅ Verify API is running
2. ✅ Test all endpoints with Postman
3. ✅ Deploy your frontend (point to production API URL)
4. ✅ Run full integration tests
5. ✅ Monitor logs for any errors

---

## Support

If deployment fails:
1. Check Railway Logs tab
2. Verify environment variables
3. Ensure PostgreSQL service is linked
4. Try re-deploying with force push

Your app is **production-ready**! 🎉
