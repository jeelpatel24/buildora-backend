# Sprint 1 Presentation Guide - Buildora Backend

**Student:** Jeel Amrutbhai Patel  
**Course:** PROG2500 - Full Stack Development  
**Sprint:** Sprint 1 (Backend)  
**Due:** Dev Day - Week 4

---

## Presentation Structure (10-12 minutes)

### 1. Introduction (1 minute)
"Hi, I'm Jeel and I've built Buildora - a platform connecting homeowners with contractors for renovation projects. Today I'll demonstrate the complete backend API I've developed for Sprint 1."

---

### 2. Project Overview (2 minutes)

#### The Problem
- Homeowners struggle to find reliable contractors
- Information is scattered across multiple platforms
- No centralized, transparent bidding system

#### The Solution: Buildora
- Web platform for posting renovation projects
- Contractors can browse and submit proposals
- Transparent, organized process for both parties

#### Tech Stack (Backend)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT + bcrypt
- **Validation**: express-validator
- **Deployment**: Render (or Railway/Heroku)

---

### 3. Database Architecture (2 minutes)

**Show your database schema in pgAdmin or DBeaver**

#### Three Core Entities:

**Users Table**
- Stores all users (Homeowners, Contractors, Admins)
- Fields: user_id, name, email, password_hash, role, is_verified
- Password hashing with bcrypt (10 salt rounds)

**Projects Table**
- Renovation projects posted by homeowners
- Fields: project_id, homeowner_id (FK), title, description, budget_min/max, location, status
- Status: Open → Accepted → Closed

**Proposals Table**
- Contractor bids on projects
- Fields: proposal_id, project_id (FK), contractor_id (FK), proposed_price, message, status
- Status: Pending → Accepted/Rejected
- Unique constraint: one proposal per contractor per project

**Relationships**
- One Homeowner → Many Projects
- One Project → Many Proposals
- One Contractor → Many Proposals
- Cascading deletes implemented

**Indexes for Performance**
- ON projects(homeowner_id)
- ON projects(status)
- ON proposals(project_id)
- ON proposals(contractor_id)

---

### 4. API Demonstration (5 minutes)

**Open Postman and demonstrate:**

#### 4.1 Authentication (1 min)
```
POST /api/auth/register
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "password123",
  "role": "Homeowner"
}
```
**Show**: JWT token returned, user object

```
POST /api/auth/login
{
  "email": "alice@example.com",
  "password": "password123"
}
```
**Show**: Same token structure, save for next requests

#### 4.2 Project Creation (1 min)
```
POST /api/projects
Authorization: Bearer {token}
{
  "title": "Kitchen Renovation",
  "description": "Complete kitchen remodel",
  "budget_min": 15000,
  "budget_max": 25000,
  "location": "Toronto, ON"
}
```
**Show**: Project created with status "Open"

#### 4.3 Contractor Workflow (1.5 min)
Register contractor:
```
POST /api/auth/register
{
  "name": "Bob Smith",
  "email": "bob@contractor.com",
  "password": "password123",
  "role": "Contractor"
}
```

Browse projects:
```
GET /api/projects
Authorization: Bearer {contractor_token}
```
**Show**: List of open projects

Submit proposal:
```
POST /api/proposals
Authorization: Bearer {contractor_token}
{
  "project_id": 1,
  "proposed_price": 20000,
  "message": "I have 10 years of experience..."
}
```
**Show**: Proposal created

#### 4.4 Accept Proposal (1 min)
```
GET /api/proposals/project/1
Authorization: Bearer {homeowner_token}
```
**Show**: List of proposals

```
PUT /api/proposals/1/accept
Authorization: Bearer {homeowner_token}
```
**Show**: 
- Proposal status → "Accepted"
- Other proposals → "Rejected"
- Project status → "Accepted"

#### 4.5 Admin Functions (0.5 min)
```
POST /api/auth/login
{
  "email": "admin@buildora.com",
  "password": "admin123"
}

GET /api/admin/stats
Authorization: Bearer {admin_token}
```
**Show**: Platform statistics

---

### 5. Security Features (2 minutes)

#### Authentication
- JWT tokens with 7-day expiration
- Tokens include: userId, email, role
- Stored in Authorization header: `Bearer {token}`

#### Authorization (Role-Based Access Control)
**Demonstrate:**
```
POST /api/projects
Authorization: Bearer {contractor_token}
```
**Expected**: 403 Forbidden - "Required role: Homeowner"

#### Password Security
**Show in database**:
- Passwords stored as bcrypt hashes (not plain text)
- 10 salt rounds
- Compare hash on login

#### Input Validation
**Show code**: `routes/auth.js`
- Email validation
- Password minimum length
- Required fields
- Budget validation (max >= min)

#### SQL Injection Prevention
**Show code**: All queries use parameterized statements
```javascript
pool.query('SELECT * FROM users WHERE email = $1', [email])
```

---

### 6. Code Quality Highlights (1 minute)

#### Project Structure
```
buildora-backend/
├── config/
│   └── database.js          # PostgreSQL connection
├── middleware/
│   └── auth.js              # JWT verification & role checks
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── projects.js          # Project CRUD
│   ├── proposals.js         # Proposal management
│   └── admin.js             # Admin functions
├── scripts/
│   └── initDatabase.js      # Database initialization
├── server.js                # Main application entry
├── package.json
├── .env.example
└── README.md
```

#### Best Practices Implemented
- ✓ Separation of concerns (routes, middleware, config)
- ✓ Environment variables (.env)
- ✓ Error handling (try-catch blocks)
- ✓ Input validation
- ✓ Transaction handling (proposal acceptance)
- ✓ Middleware for authentication
- ✓ Clean, commented code
- ✓ RESTful API design

---

### 7. Technical Question Preparation

**Be ready to answer:**

**Q1: "Show me where you defined your authentication middleware"**
**A:** Open `middleware/auth.js` - explain authenticateToken and authorizeRole functions

**Q2: "How do you prevent SQL injection?"**
**A:** Show parameterized queries with `$1, $2` placeholders instead of string concatenation

**Q3: "What happens when a homeowner accepts a proposal?"**
**A:** Show `routes/proposals.js` - accept proposal endpoint:
1. Start database transaction
2. Set selected proposal to "Accepted"
3. Reject all other proposals for that project
4. Update project status to "Accepted"
5. Commit transaction (or rollback on error)

**Q4: "How does role-based authorization work?"**
**A:** Show `middleware/auth.js`:
1. JWT token contains user's role
2. authorizeRole middleware checks if user's role matches allowed roles
3. Returns 403 if not authorized

**Q5: "Show me your database relationships"**
**A:** Open database schema or `scripts/initDatabase.js`:
- homeowner_id in projects → REFERENCES users(user_id)
- project_id in proposals → REFERENCES projects(project_id)
- contractor_id in proposals → REFERENCES users(user_id)
- All with CASCADE delete

---

### 8. Deployment (1 minute)

**Show live deployment:**
```
Deployed URL: https://buildora-api.onrender.com
```

**Test live API:**
```bash
curl https://buildora-api.onrender.com
```

**Show response:**
```json
{
  "message": "Buildora API is running",
  "version": "1.0.0"
}
```

**GitHub Repository:**
```
https://github.com/YOUR_USERNAME/buildora-backend
```

**Show:**
- Regular commit history
- Descriptive commit messages
- README with setup instructions

---

## Rubric Alignment

### Deployment & Integrity (10 points)
✓ Deployed to Render (live public URL)  
✓ GitHub repository with healthy commit history  
✓ Regular commits throughout development  
✓ Descriptive commit messages

### Sprint Completion (40 points)
✓ All authentication endpoints complete and functional  
✓ All project CRUD operations implemented  
✓ All proposal management features working  
✓ Admin functionality implemented  
✓ Code runs without errors  
✓ All validations in place

### Technical Understanding (30 points)
✓ Can navigate codebase confidently  
✓ Can explain authentication flow  
✓ Can explain database relationships  
✓ Can explain middleware usage  
✓ Can answer technical questions correctly

### Lab Participation (20 points)
✓ Attended workshop sessions  
✓ Ready to demo during class time  
✓ Code is complete and tested

**Target Score: 100/100**

---

## Pre-Presentation Checklist

**24 Hours Before:**
- [ ] Test all API endpoints locally
- [ ] Verify database is initialized
- [ ] Push latest code to GitHub
- [ ] Deploy to Render/Railway/Heroku
- [ ] Test live deployment
- [ ] Verify admin credentials work
- [ ] Prepare Postman collection

**1 Hour Before:**
- [ ] Open pgAdmin/DBeaver (database ready to show)
- [ ] Open Postman with saved requests
- [ ] Open VS Code with project
- [ ] Test internet connection
- [ ] Have backup: screenshots of working API

**During Presentation:**
- [ ] Speak clearly and confidently
- [ ] Show, don't just tell
- [ ] Be ready for questions
- [ ] Stay calm if something breaks

---

## Backup Plan

**If live demo fails:**
1. Have screenshots of working API responses
2. Show local version (localhost)
3. Walk through code instead
4. Explain what should happen

**If database connection fails:**
1. Show database schema screenshot
2. Explain table structure verbally
3. Show SQL in initDatabase.js

---

## Key Talking Points

1. **Real-World Problem**: Buildora solves actual pain points in home renovation
2. **Scalable Architecture**: Three-entity database design can grow
3. **Security First**: JWT, bcrypt, role-based access, input validation
4. **Production Ready**: Deployed, documented, tested
5. **Clean Code**: Organized structure, separation of concerns
6. **Full Stack Foundation**: Backend ready for React frontend (Sprint 2)

---

## Questions to Expect

1. Why did you choose PostgreSQL over MySQL?
2. How would you add email notifications?
3. What would you improve if you had more time?
4. How does your JWT token system work?
5. Show me how you handle errors
6. What is the purpose of middleware?
7. How do you prevent duplicate proposals?
8. Explain your database relationships

**Prepare brief, confident answers for each!**

---

## Final Tips

✓ Practice your demo at least twice  
✓ Time yourself (stay under 12 minutes)  
✓ Prepare answers to technical questions  
✓ Test everything one more time before class  
✓ Get a good night's sleep  
✓ Arrive early to set up  

**You've got this! 🚀**

---

## After Presentation

1. Submit GitHub URL to assignment folder
2. Include deployment URL in submission
3. Listen to instructor feedback
4. Note improvements for Sprint 2
5. Celebrate completing Sprint 1! 🎉
