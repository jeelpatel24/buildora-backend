# Sprint 1 Submission Checklist

Use this checklist to ensure you have everything ready for your Dev Day presentation and submission.

## Pre-Submission Tasks

### Code Completion
- [ ] All route files created and working
  - [ ] `routes/auth.js` - Register & Login
  - [ ] `routes/projects.js` - Project CRUD
  - [ ] `routes/proposals.js` - Proposal management
  - [ ] `routes/admin.js` - Admin functions
- [ ] Middleware implemented
  - [ ] `middleware/auth.js` - JWT verification & role checks
- [ ] Database configuration
  - [ ] `config/database.js` - PostgreSQL connection
- [ ] Database initialization script
  - [ ] `scripts/initDatabase.js` - Creates tables & admin user
- [ ] Main server file
  - [ ] `server.js` - Express app setup

### Testing
- [ ] Tested locally with Postman
- [ ] All authentication endpoints work
- [ ] All project endpoints work
- [ ] All proposal endpoints work
- [ ] All admin endpoints work
- [ ] Role-based authorization tested
- [ ] Error handling verified
- [ ] Database relationships verified

### Documentation
- [ ] `README.md` - Project overview & setup instructions
- [ ] `API_DOCUMENTATION.md` - Complete API reference
- [ ] `TESTING_GUIDE.md` - Test scenarios
- [ ] `DEPLOYMENT.md` - Deployment instructions
- [ ] `PRESENTATION_GUIDE.md` - Presentation tips
- [ ] `.env.example` - Example environment variables

---

## GitHub Repository Setup

### Initialize Git
```bash
cd "C:\Users\jeelp\Documents\Sem_4\Prog2500 Full Stack\Buildora"
git init
git add .
git commit -m "Initial commit - Buildora Sprint 1 Backend"
```

### Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `buildora-backend`
3. Description: "Buildora - Home Renovation Project Matching Platform (PROG2500 Sprint 1)"
4. Set to Public
5. Do NOT initialize with README (we have one)
6. Click "Create repository"

### Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/buildora-backend.git
git branch -M main
git push -u origin main
```

### Verify GitHub Repository
- [ ] Code is pushed to GitHub
- [ ] Repository is public
- [ ] README.md displays on repository page
- [ ] All files are present
- [ ] .env is NOT pushed (should be in .gitignore)

### Commit History
- [ ] Multiple commits (not just one)
- [ ] Descriptive commit messages
- [ ] Commits show development progress

**Example good commits:**
```
✓ "Add database schema and initialization script"
✓ "Implement user authentication with JWT"
✓ "Add project CRUD endpoints"
✓ "Implement proposal submission and acceptance"
✓ "Add admin verification endpoints"
✓ "Add input validation and error handling"
```

**Example bad commits:**
```
✗ "update"
✗ "fixes"
✗ "final"
```

---

## Deployment Setup

### Option 1: Render (Recommended)

#### Create Database
- [ ] Signed up for Render account
- [ ] Created PostgreSQL database named `buildora-db`
- [ ] Saved Internal Database URL

#### Deploy Web Service
- [ ] Connected GitHub repository to Render
- [ ] Configured build command: `npm install`
- [ ] Configured start command: `npm start`
- [ ] Added environment variables:
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`
  - [ ] `NODE_ENV=production`
- [ ] Deployment successful
- [ ] Service shows "Live"

#### Initialize Production Database
- [ ] Opened Render Shell
- [ ] Ran `npm run init-db`
- [ ] Admin user created successfully

#### Test Live Deployment
- [ ] API responds at live URL
- [ ] Can register users on live API
- [ ] Can login on live API
- [ ] Can create projects on live API
- [ ] All endpoints work on live API

**Live URL:** ________________________________

---

## Final Testing Checklist

### Local Testing (localhost:3000)
- [ ] Health check: GET /
- [ ] Register homeowner: POST /api/auth/register
- [ ] Login homeowner: POST /api/auth/login
- [ ] Create project: POST /api/projects
- [ ] View projects: GET /api/projects
- [ ] Register contractor: POST /api/auth/register
- [ ] Submit proposal: POST /api/proposals
- [ ] View proposals: GET /api/proposals/project/:id
- [ ] Accept proposal: PUT /api/proposals/:id/accept
- [ ] Admin login: POST /api/auth/login
- [ ] View stats: GET /api/admin/stats

### Live Deployment Testing (Render URL)
- [ ] Health check works
- [ ] Can register users
- [ ] Can login
- [ ] Can create projects
- [ ] Can submit proposals
- [ ] All CRUD operations work

### Security Testing
- [ ] Cannot access protected routes without token
- [ ] Contractor cannot create projects
- [ ] Homeowner cannot submit proposals
- [ ] Wrong password fails login
- [ ] Duplicate proposal is rejected
- [ ] Passwords are hashed in database

---

## Presentation Preparation

### Equipment Setup
- [ ] Laptop charged
- [ ] Internet connection tested
- [ ] Postman installed with collection imported
- [ ] VS Code opened with project
- [ ] Database tool ready (pgAdmin/DBeaver)
- [ ] Browser tabs prepared:
  - [ ] GitHub repository
  - [ ] Live deployment URL
  - [ ] Localhost (as backup)

### Demo Data Prepared
- [ ] Admin credentials ready
- [ ] Test homeowner account created
- [ ] Test contractor account created
- [ ] At least one project created
- [ ] At least one proposal submitted

### Knowledge Check
- [ ] Can explain database schema
- [ ] Can explain authentication flow
- [ ] Can show where routes are defined
- [ ] Can explain middleware usage
- [ ] Can explain proposal acceptance logic
- [ ] Can explain security features

---

## Submission

### Create Submission File
Create a text file named `SUBMISSION.txt`:

```
PROG2500 - Sprint 1 Submission
Student: Jeel Amrutbhai Patel

GitHub Repository:
https://github.com/YOUR_USERNAME/buildora-backend

Live Deployment URL:
https://buildora-api.onrender.com

Admin Credentials (for instructor testing):
Email: admin@buildora.com
Password: admin123

Test Accounts:
Homeowner: alice@example.com / password123
Contractor: bob@example.com / password123

Notes:
- All Sprint 1 requirements completed
- Database initialized with sample data
- All API endpoints tested and working
- Role-based authentication implemented
- Ready for live demonstration
```

### Submit to D2L
- [ ] Logged into D2L Brightspace
- [ ] Found PROG2500 course
- [ ] Navigated to Course Tools → Assignments
- [ ] Found "Practical Lab - Sprint 1 Review"
- [ ] Clicked "Add a file"
- [ ] Uploaded `SUBMISSION.txt`
- [ ] Clicked "Submit"
- [ ] Received confirmation email

---

## Dev Day Checklist

### Day Before
- [ ] Test everything one more time
- [ ] Verify live deployment is working
- [ ] Practice demo (aim for 8-10 minutes)
- [ ] Prepare answers to common questions
- [ ] Charge laptop fully
- [ ] Get good sleep!

### Morning Of
- [ ] Arrive 15 minutes early
- [ ] Set up equipment
- [ ] Test internet connection
- [ ] Open all necessary windows
- [ ] Take deep breath - you've got this!

### During Presentation
- [ ] Speak clearly
- [ ] Show confidence
- [ ] Demonstrate features (don't just talk)
- [ ] Answer questions honestly
- [ ] If something breaks, stay calm
- [ ] Show backup (localhost) if needed

---

## Rubric Verification

### Deployment & Integrity (10 points)
- [ ] Project deployed to live URL ✓
- [ ] Accessible from internet ✓
- [ ] GitHub repository with commit history ✓
- [ ] Regular commits throughout development ✓
- [ ] Descriptive commit messages ✓

### Sprint Completion (40 points)
- [ ] Authentication complete and functional ✓
- [ ] Projects CRUD complete and functional ✓
- [ ] Proposals system complete and functional ✓
- [ ] Admin features complete and functional ✓
- [ ] Code runs without errors ✓
- [ ] All requirements met ✓

### Technical Understanding (30 points)
- [ ] Can navigate codebase confidently ✓
- [ ] Can explain how authentication works ✓
- [ ] Can show where routes are defined ✓
- [ ] Can explain database relationships ✓
- [ ] Can answer technical questions ✓

### Participation (20 points)
- [ ] Attended workshop sessions ✓
- [ ] Present for Sprint 1 Dev Day ✓
- [ ] Ready to demonstrate on time ✓

**Expected Score: 100/100** ✓

---

## Common Questions & Answers

**Q: What if my deployment breaks?**
A: Have localhost running as backup. Explain what should work.

**Q: What if I can't answer a technical question?**
A: Be honest. Say "I'm not sure, but I can look it up" or explain your thought process.

**Q: How long should my demo be?**
A: Aim for 8-10 minutes. Practice to stay within time.

**Q: What's the most important thing?**
A: Show working code! A live demo is worth more than talking about it.

---

## Final Notes

✓ You've built a complete, professional backend API
✓ You've implemented authentication, authorization, and CRUD
✓ You've deployed to production
✓ You've documented everything thoroughly
✓ You're ready to present with confidence!

**Remember:**
- This is YOUR project - be proud of it!
- Mistakes happen - stay calm and professional
- Show what you've learned
- Demonstrate your technical skills
- Have fun presenting your work!

---

## After Submission

- [ ] Reviewed instructor feedback
- [ ] Noted improvements for Sprint 2
- [ ] Started planning frontend (React)
- [ ] Celebrated completing Sprint 1! 🎉

---

## Contact Information

If you have questions:
- Review the documentation files
- Check the testing guide
- Look at the presentation guide
- Ask instructor during office hours

**Good luck! You've got this! 🚀**

---

**Last Updated:** Ready for Sprint 1 Submission
**Status:** ✓ Complete and Ready to Submit
