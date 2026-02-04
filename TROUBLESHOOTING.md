# Buildora Troubleshooting Guide

Common issues and their solutions for Railway PostgreSQL setup.

## Installation Issues

### Issue: `npm install` fails
**Symptoms:** Error messages during package installation

**Solutions:**
1. Delete `node_modules` folder and `package-lock.json`
2. Run `npm install` again
3. If still failing, try: `npm cache clean --force`
4. Make sure you have Node.js v14 or higher: `node --version`

### Issue: Module not found error
**Symptoms:** `Error: Cannot find module 'express'`

**Solution:**
```bash
npm install
```

---

## Railway Database Issues

### Issue: "Connection refused" or "ECONNREFUSED"
**Symptoms:** Cannot connect to Railway PostgreSQL

**Solutions:**
1. **Check your internet connection** - Railway database is in the cloud

2. **Verify DATABASE_URL in .env:**
   - Should be copied exactly from Railway dashboard
   - Format: `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway`
   - Don't type it manually - copy/paste from Railway

3. **Check Railway database is running:**
   - Go to Railway dashboard: https://railway.app/
   - Click on PostgreSQL service
   - Status should be "Active" or "Running"

4. **Verify .env file exists and is correct:**
   ```env
   DATABASE_URL=postgresql://postgres:abc123@containers-us-west-123.railway.app:5432/railway
   ```

### Issue: "password authentication failed"
**Symptoms:** `FATAL: password authentication failed`

**Solutions:**
1. **Copy DATABASE_URL directly from Railway:**
   - Railway Dashboard → PostgreSQL → Variables → DATABASE_URL
   - Copy the ENTIRE string
   - Paste into .env (replace the whole line)

2. **Don't edit the URL manually:**
   - The password in the URL is auto-generated
   - Any typo will cause authentication failure

3. **Make sure you're using the correct Railway project:**
   - You might have multiple databases
   - Check you're copying from the right one

### Issue: "database does not exist"
**Symptoms:** `FATAL: database "buildora" does not exist`

**Solution:**
When using Railway, the database name is usually "railway" not "buildora". This is already configured in your code, but if you see this error:

1. Check your DATABASE_URL contains the correct database name at the end
2. Railway databases are typically named "railway"
3. Don't try to create a "buildora" database - use the Railway default

### Issue: "relation does not exist" 
**Symptoms:** `error: relation "users" does not exist`

**Solution:**
Initialize the database tables on Railway:
```bash
npm run init-db
```

This creates all tables in your Railway PostgreSQL database.

### Issue: Tables not created
**Symptoms:** init-db runs but tables still don't exist

**Solutions:**
1. **Check the DATABASE_URL is correct in .env**
2. **Look for error messages in init-db output**
3. **Verify in Railway dashboard:**
   - PostgreSQL → Data tab
   - You should see users, projects, proposals tables
4. **Run init-db again:**
   ```bash
   npm run init-db
   ```

### Issue: "Too many connections"
**Symptoms:** `sorry, too many clients already`

**Solutions:**
1. **Railway free tier limits concurrent connections**
2. **Close unused connections:**
   - Stop your local server (Ctrl+C)
   - Wait 30 seconds
   - Start again: `npm run dev`

3. **Check your connection pool settings:**
   - In `config/database.js`
   - Should have `max: 5` or similar
   - Don't set too high for Railway free tier

### Issue: Cannot see data in Railway dashboard
**Symptoms:** Data tab is empty or shows wrong data

**Solutions:**
1. Click "Refresh" button in Railway Data tab
2. Make sure you're looking at the correct database
3. Run a query manually:
   ```sql
   SELECT * FROM users;
   ```

---

## Server Issues

### Issue: "Port 3000 already in use"
**Symptoms:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions:**

**Option 1:** Change port in .env:
```env
PORT=3001
```

**Option 2:** Kill process using port 3000:
- Windows: 
  ```bash
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```
- Mac/Linux:
  ```bash
  lsof -ti:3000 | xargs kill -9
  ```

### Issue: Server crashes immediately
**Symptoms:** Server starts then crashes with error

**Common Causes & Fixes:**
1. **Missing .env file:**
   - Copy `.env.example` to `.env`
   - Fill in your Railway DATABASE_URL

2. **Invalid DATABASE_URL:**
   - Copy again from Railway dashboard
   - Make sure entire URL is on one line

3. **Missing dependencies:**
   - Run `npm install`

4. **No internet connection:**
   - Railway database requires internet
   - Check your connection

### Issue: "Cannot read property of undefined"
**Symptoms:** TypeError errors in server logs

**Solution:**
1. Check which variable is undefined in error message
2. Verify .env file has all required variables:
   ```env
   DATABASE_URL=...
   JWT_SECRET=...
   PORT=3000
   NODE_ENV=development
   ```
3. Make sure database is initialized with `npm run init-db`

---

## Authentication Issues

### Issue: "Invalid or expired token"
**Symptoms:** 403 error when making authenticated requests

**Solutions:**
1. **Token expired (7 days):**
   - Login again to get new token
   
2. **Wrong token:**
   - Copy the full token from login response
   - Include "Bearer " prefix in Authorization header

3. **Token format:**
   ```
   Correct: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Wrong:   Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Issue: "Access denied. No token provided"
**Symptoms:** 401 error on protected endpoints

**Solution:**
Add Authorization header to your request:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

### Issue: Login returns "Invalid email or password"
**Symptoms:** Cannot login with correct credentials

**Solutions:**
1. Verify email is exactly as registered (case-sensitive)
2. Check if user exists in Railway database:
   - Go to Railway Dashboard → PostgreSQL → Data
   - Select users table
   - Look for your email
3. If user doesn't exist, register first

### Issue: "Email already registered"
**Symptoms:** Cannot register with an email

**Solution:**
Either:
1. Use a different email
2. Login with existing email
3. Delete the user from Railway database (for testing):
   - Railway Dashboard → PostgreSQL → Data
   - Find the user and delete it

---

## API Request Issues

### Issue: 404 Not Found
**Symptoms:** Endpoint returns 404

**Solutions:**
1. Check the URL path is correct:
   ```
   Correct: http://localhost:3000/api/auth/login
   Wrong:   http://localhost:3000/auth/login
   ```

2. Verify HTTP method:
   ```
   POST /api/auth/login  ✓
   GET  /api/auth/login  ✗
   ```

3. Check server logs for the request

### Issue: 403 Forbidden
**Symptoms:** "Access denied. Required role: Homeowner"

**Solution:**
You're using the wrong user role. For example:
- Creating project requires Homeowner role
- Submitting proposal requires Contractor role
- Admin functions require Admin role

Login with the correct user type.

### Issue: 400 Bad Request with validation errors
**Symptoms:** Array of validation errors returned

**Solutions:**
Check request body matches required format:

```json
// For registration:
{
  "name": "Required, string",
  "email": "Required, valid email",
  "password": "Required, min 6 chars",
  "role": "Required, Homeowner or Contractor"
}

// For project creation:
{
  "title": "Required, string",
  "description": "Required, string",
  "budget_min": "Required, number >= 0",
  "budget_max": "Required, number >= budget_min",
  "location": "Required, string"
}
```

### Issue: "You have already submitted a proposal"
**Symptoms:** 409 Conflict when submitting proposal

**Explanation:**
This is expected behavior - one contractor can only submit one proposal per project.

**Solutions:**
1. Check if you already submitted: GET /api/proposals/my
2. Withdraw existing proposal if needed: DELETE /api/proposals/:id
3. Submit to a different project

---

## Railway Deployment Issues

### Issue: Build fails on Railway deployment
**Symptoms:** Deployment shows "Build failed"

**Solutions:**
1. Check build logs in Railway for specific error
2. Verify `package.json` has correct dependencies
3. Make sure all required files are committed to GitHub
4. Check `package.json` has correct scripts:
   ```json
   "scripts": {
     "start": "node server.js",
     "dev": "nodemon server.js"
   }
   ```

### Issue: Deployed app shows "Application Error"
**Symptoms:** Live Railway URL returns error page

**Solutions:**
1. **Check environment variables in Railway:**
   - Go to Railway project
   - Click on your app service
   - Go to Variables tab
   - Make sure these exist:
     ```
     DATABASE_URL = ${{Postgres.DATABASE_URL}}
     JWT_SECRET = your-production-secret
     NODE_ENV = production
     ```

2. **Check logs in Railway:**
   - Click on your app service
   - Go to Deployments tab
   - Click on latest deployment
   - View logs for errors

3. **Common issues:**
   - Database not linked
   - Environment variables missing
   - Build command incorrect

### Issue: Database not initialized on Railway deployment
**Symptoms:** "relation does not exist" on live URL

**Solution:**
1. **Using Railway CLI:**
   ```bash
   npm i -g @railway/cli
   railway login
   railway link
   railway run npm run init-db
   ```

2. **Or using Railway dashboard:**
   - Not directly possible
   - Best to init database BEFORE deploying
   - Or connect to database manually and run SQL

### Issue: "Failed to connect to database" on Railway deployment
**Symptoms:** Cannot connect to production database on Railway

**Solutions:**
1. **Make sure PostgreSQL service is running:**
   - Railway Dashboard → PostgreSQL
   - Should show "Active"

2. **Link database to app:**
   - Railway Dashboard → Your App
   - Variables tab
   - Add: `DATABASE_URL = ${{Postgres.DATABASE_URL}}`
   - This references your PostgreSQL service

3. **Check database is in same project:**
   - Both app and database should be in same Railway project

### Issue: Railway free tier limits exceeded
**Symptoms:** Service stopped or errors about limits

**Solutions:**
1. **Check usage:**
   - Railway Dashboard → Settings → Usage
   - Free tier: $5/month

2. **Optimize usage:**
   - Reduce connection pool size
   - Don't leave database idle
   - Stop services when not testing

3. **Add payment method:**
   - You can add credit card
   - Won't be charged until you exceed $5
   - Good for preventing service interruption

---

## Testing Issues

### Issue: Postman requests not working
**Symptoms:** Requests fail or timeout

**Solutions:**
1. **Server not running:**
   - Check terminal - is `npm run dev` running?
   - Visit http://localhost:3000 in browser

2. **Wrong URL:**
   - Local: `http://localhost:3000`
   - Deployed: Your Railway URL (e.g., `buildora-production.up.railway.app`)

3. **Missing headers:**
   - Add `Content-Type: application/json`
   - Add `Authorization: Bearer TOKEN` for protected routes

4. **Body format:**
   - Select "raw" and "JSON" in Postman
   - Check JSON syntax is valid

### Issue: Cannot import Postman collection
**Symptoms:** Error importing collection file

**Solution:**
1. Use "Import" button in Postman
2. Select "File"
3. Choose `Buildora_API.postman_collection.json`
4. If fails, copy-paste JSON content directly

---

## Common Error Messages

### "Cannot set headers after they are sent"
**Cause:** Multiple responses sent for single request

**Solution:**
Check for multiple `res.json()` or `res.send()` calls. Use `return` before responses:
```javascript
if (error) {
  return res.status(400).json({ error: 'Bad request' });
}
res.json({ success: true }); // This won't run if error
```

### "Unexpected end of JSON input"
**Cause:** Invalid JSON in request body

**Solution:**
Validate JSON syntax. Common issues:
- Missing closing brace }
- Trailing comma
- Unquoted keys
- Single quotes instead of double quotes

### "JWT malformed"
**Cause:** Invalid token format

**Solution:**
1. Token should have three parts separated by dots: `xxx.yyy.zzz`
2. Include full token from login response
3. Don't add extra characters or spaces

---

## Railway-Specific Tips

### Check Railway Service Status
```
Railway Dashboard → Your Project → PostgreSQL → Should show "Active"
```

### View Railway Database
```
Railway Dashboard → PostgreSQL → Data tab
```

### Railway CLI Commands
```bash
# Install CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run commands on Railway
railway run npm run init-db

# View logs
railway logs
```

### Railway Free Tier Limits
- $5/month credit
- Good for development and testing
- PostgreSQL usually costs $5-10/month
- Monitor usage: Railway Dashboard → Settings → Usage

---

## Quick Diagnostic Commands

```bash
# Check if Node.js is installed
node --version

# Check if npm is installed
npm --version

# Check if server responds locally
curl http://localhost:3000

# Test Railway database connection (requires DATABASE_URL in .env)
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"

# Check environment variables are loaded
node -e "require('dotenv').config(); console.log(process.env)"
```

---

## When All Else Fails

1. **Read the error message carefully** - It usually tells you what's wrong

2. **Check Railway dashboard:**
   - Is PostgreSQL running?
   - Are there any errors shown?
   - Check the Data tab

3. **Start fresh:**
   ```bash
   # Stop server (Ctrl+C)
   rm -rf node_modules package-lock.json
   npm install
   npm run init-db
   npm run dev
   ```

4. **Verify .env file:**
   - DATABASE_URL is correct (copy from Railway)
   - JWT_SECRET is set
   - No extra spaces or quotes

5. **Check documentation:**
   - Read RAILWAY_SETUP.md
   - Review API_DOCUMENTATION.md
   - Check TESTING_GUIDE.md

6. **Test with minimal example:**
   ```bash
   curl http://localhost:3000
   ```

---

## Getting Help

If you're stuck:
1. Read the error message completely
2. Check this troubleshooting guide
3. Review RAILWAY_SETUP.md
4. Check Railway documentation: https://docs.railway.app/
5. Search for the error message online
6. Ask instructor during office hours

---

## Prevention Tips

To avoid issues:
- ✓ Always copy DATABASE_URL directly from Railway (don't type it)
- ✓ Use `npm run dev` for development (auto-reload)
- ✓ Keep .env file updated with correct values
- ✓ Never commit .env to Git
- ✓ Test locally before deploying
- ✓ Make regular git commits
- ✓ Read error messages carefully
- ✓ Use Postman collection for consistent testing
- ✓ Keep internet connection stable (cloud database)
- ✓ Monitor Railway usage to stay within free tier

---

## Railway-Specific Prevention

- ✓ Don't create database manually - use Railway's provision
- ✓ Link database to app using `${{Postgres.DATABASE_URL}}`
- ✓ Initialize database BEFORE deploying
- ✓ Check Railway status page if services are down
- ✓ Keep Railway CLI updated: `npm i -g @railway/cli@latest`

---

## Still Stuck?

Document your issue:
1. What are you trying to do?
2. What steps did you take?
3. What error message do you see?
4. What have you tried to fix it?
5. Is this local development or Railway deployment?
6. Share relevant code/logs

This helps with troubleshooting!

---

## Railway Support Resources

- Railway Docs: https://docs.railway.app/
- Railway Discord: https://discord.gg/railway  
- Railway Status: https://status.railway.app/
- Railway Help Center: https://help.railway.app/
