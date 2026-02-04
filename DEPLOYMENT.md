# Buildora Deployment Guide

This guide covers deploying Buildora to production hosting platforms.

## Deployment to Render (Recommended)

Render provides free PostgreSQL and web service hosting, perfect for this project.

### Prerequisites
- GitHub account
- Render account (sign up at render.com)

### Step 1: Prepare Your Repository

1. Initialize Git (if not already done):
```bash
cd "C:\Users\jeelp\Documents\Sem_4\Prog2500 Full Stack\Buildora"
git init
git add .
git commit -m "Initial commit - Buildora backend"
```

2. Create a new repository on GitHub

3. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/buildora-backend.git
git branch -M main
git push -u origin main
```

### Step 2: Create PostgreSQL Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: buildora-db
   - **Database**: buildora
   - **User**: buildora (auto-generated)
   - **Region**: Choose closest to you
   - **Plan**: Free
4. Click "Create Database"
5. **Save the Internal Database URL** (you'll need this)

### Step 3: Deploy Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: buildora-api
   - **Region**: Same as database
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. Add Environment Variables:
   - Click "Advanced" → "Add Environment Variable"
   - Add these variables:
     - `DATABASE_URL`: (paste the Internal Database URL from Step 2)
     - `JWT_SECRET`: (generate a random 32+ character string)
     - `NODE_ENV`: production
     - `PORT`: 3000

5. Click "Create Web Service"

### Step 4: Initialize Database

After deployment completes:

1. Go to your web service dashboard
2. Click "Shell" tab
3. Run:
```bash
npm run init-db
```

This creates all tables and the admin user.

### Step 5: Test Your Deployment

Your API will be available at:
```
https://buildora-api.onrender.com
```

Test with:
```bash
curl https://buildora-api.onrender.com
```

You should see:
```json
{
  "message": "Buildora API is running",
  "version": "1.0.0",
  ...
}
```

---

## Alternative: Deployment to Railway

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login and Initialize
```bash
railway login
cd "C:\Users\jeelp\Documents\Sem_4\Prog2500 Full Stack\Buildora"
railway init
```

### Step 3: Add PostgreSQL
```bash
railway add --plugin postgresql
```

### Step 4: Set Environment Variables
```bash
railway variables set JWT_SECRET="your_secret_key_here"
railway variables set NODE_ENV="production"
```

### Step 5: Deploy
```bash
railway up
```

### Step 6: Initialize Database
```bash
railway run npm run init-db
```

---

## Alternative: Deployment to Heroku

### Prerequisites
- Heroku CLI installed
- Heroku account

### Step 1: Login to Heroku
```bash
heroku login
```

### Step 2: Create Heroku App
```bash
cd "C:\Users\jeelp\Documents\Sem_4\Prog2500 Full Stack\Buildora"
heroku create buildora-api
```

### Step 3: Add PostgreSQL
```bash
heroku addons:create heroku-postgresql:essential-0
```

### Step 4: Set Environment Variables
```bash
heroku config:set JWT_SECRET="your_super_secret_jwt_key_32_chars_min"
heroku config:set NODE_ENV="production"
```

### Step 5: Deploy
```bash
git push heroku main
```

### Step 6: Initialize Database
```bash
heroku run npm run init-db
```

### Step 7: Open Your App
```bash
heroku open
```

---

## Environment Variables Reference

Required environment variables for production:

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@host:5432/db |
| JWT_SECRET | Secret key for JWT tokens (32+ chars) | aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3x |
| NODE_ENV | Environment mode | production |
| PORT | Server port (usually auto-set) | 3000 |

---

## Post-Deployment Checklist

After deployment, verify:

- [ ] API responds at root endpoint (`/`)
- [ ] Database tables are created (run init-db script)
- [ ] Can register a new user
- [ ] Can login and receive JWT token
- [ ] Can create a project (with valid token)
- [ ] Can browse projects
- [ ] Can submit proposals
- [ ] Admin user exists (admin@buildora.com / admin123)

---

## GitHub Actions CI/CD (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests (if you have any)
        run: npm test
        
      - name: Deploy to Render
        run: |
          curl https://api.render.com/deploy/srv-xxxxx?key=${{ secrets.RENDER_DEPLOY_HOOK_URL }}
```

---

## Monitoring & Logs

### Render
- View logs in real-time from the "Logs" tab
- Set up email alerts for errors

### Heroku
```bash
heroku logs --tail
```

### Railway
```bash
railway logs
```

---

## Database Backups

### Render
- Backups are automatic on paid plans
- Free tier: Use `pg_dump` manually

### Manual Backup
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Restore
```bash
psql $DATABASE_URL < backup.sql
```

---

## Troubleshooting

### Issue: "Application Error"
**Check logs** for specific error messages

### Issue: "Database connection failed"
**Verify DATABASE_URL** is set correctly

### Issue: "Module not found"
**Run** `npm install` in the build command

### Issue: "Port already in use"
**Use** `process.env.PORT` instead of hardcoded port

---

## Security Best Practices

1. **Never commit `.env` file** - Use environment variables
2. **Use strong JWT_SECRET** - Generate random 32+ character string
3. **Enable HTTPS** - Most platforms do this automatically
4. **Rate limiting** - Add in production (use express-rate-limit)
5. **CORS** - Configure allowed origins for production
6. **Input validation** - Already implemented with express-validator
7. **SQL injection prevention** - Using parameterized queries (already implemented)

---

## Production Enhancements (Future)

- [ ] Rate limiting middleware
- [ ] Request logging (Morgan)
- [ ] Error tracking (Sentry)
- [ ] API documentation (Swagger)
- [ ] Database migrations (node-pg-migrate)
- [ ] Email notifications (SendGrid/Mailgun)
- [ ] File uploads (Cloudinary/AWS S3)
- [ ] Caching (Redis)

---

## Getting Your Deployment URL

After successful deployment, your API will be accessible at:

- **Render**: `https://your-service-name.onrender.com`
- **Railway**: `https://your-project.up.railway.app`
- **Heroku**: `https://your-app-name.herokuapp.com`

Update your frontend (when you build it in Sprint 2) to use this URL instead of localhost.

---

## Submission for Assignment

For your Sprint 1 submission, include:

1. **GitHub Repository URL**
2. **Live Deployment URL** (e.g., Render URL)
3. **Admin Credentials** (for instructor testing):
   - Email: admin@buildora.com
   - Password: admin123
4. **Sample Test Accounts** (create these):
   - Homeowner: homeowner@test.com / test123
   - Contractor: contractor@test.com / test123

Make sure to test all endpoints work on the live URL before submitting!
