# Buildora Testing Guide

This guide will help you test all the features of Buildora for your Sprint 1 presentation.

## Setup Instructions

### 1. Install PostgreSQL
Make sure PostgreSQL is installed and running on your machine.

### 2. Install Dependencies
```bash
cd "C:\Users\jeelp\Documents\Sem_4\Prog2500 Full Stack\Buildora"
npm install
```

### 3. Configure Environment
Create a `.env` file in the project root:
```env
PORT=3000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/buildora
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
NODE_ENV=development
```

Replace `yourpassword` with your PostgreSQL password.

### 4. Initialize Database
```bash
npm run init-db
```

This will create all tables and insert a default admin user:
- Email: admin@buildora.com
- Password: admin123

### 5. Start Server
```bash
npm run dev
```

Server will start on http://localhost:3000

---

## Testing Scenarios

### Scenario 1: User Registration & Login

#### Test Case 1.1: Register as Homeowner
**Endpoint:** POST http://localhost:3000/api/auth/register

**Request:**
```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "password123",
  "role": "Homeowner"
}
```

**Expected Response:** 201 Created
- Receive JWT token
- User object with role "Homeowner"

#### Test Case 1.2: Register as Contractor
**Endpoint:** POST http://localhost:3000/api/auth/register

**Request:**
```json
{
  "name": "Bob Smith",
  "email": "bob@example.com",
  "password": "password123",
  "role": "Contractor"
}
```

**Expected Response:** 201 Created
- Receive JWT token
- User object with role "Contractor"
- is_verified should be FALSE

#### Test Case 1.3: Login as Homeowner
**Endpoint:** POST http://localhost:3000/api/auth/login

**Request:**
```json
{
  "email": "alice@example.com",
  "password": "password123"
}
```

**Expected Response:** 200 OK
- Receive valid JWT token
- Save this token for subsequent requests

---

### Scenario 2: Project Management (Homeowner)

#### Test Case 2.1: Create Project
**Endpoint:** POST http://localhost:3000/api/projects

**Headers:**
```
Authorization: Bearer <Alice's token>
```

**Request:**
```json
{
  "title": "Kitchen Renovation",
  "description": "Complete kitchen remodel with new cabinets, countertops, and appliances",
  "budget_min": 15000,
  "budget_max": 25000,
  "location": "Toronto, ON"
}
```

**Expected Response:** 201 Created
- Project created with status "Open"

#### Test Case 2.2: Create Another Project
**Request:**
```json
{
  "title": "Bathroom Upgrade",
  "description": "Modern bathroom with walk-in shower",
  "budget_min": 8000,
  "budget_max": 12000,
  "location": "Waterloo, ON"
}
```

#### Test Case 2.3: View My Projects
**Endpoint:** GET http://localhost:3000/api/projects/my

**Headers:**
```
Authorization: Bearer <Alice's token>
```

**Expected Response:** 200 OK
- List of Alice's projects (2 projects)
- Each project shows proposal_count

#### Test Case 2.4: Update Project
**Endpoint:** PUT http://localhost:3000/api/projects/1

**Headers:**
```
Authorization: Bearer <Alice's token>
```

**Request:**
```json
{
  "title": "Kitchen Renovation - Updated",
  "description": "Updated description with more details",
  "budget_min": 18000,
  "budget_max": 28000,
  "location": "Toronto, ON"
}
```

**Expected Response:** 200 OK
- Project updated successfully

---

### Scenario 3: Browsing & Proposals (Contractor)

#### Test Case 3.1: Login as Contractor
**Endpoint:** POST http://localhost:3000/api/auth/login

**Request:**
```json
{
  "email": "bob@example.com",
  "password": "password123"
}
```

Save Bob's token for next requests.

#### Test Case 3.2: Browse Open Projects
**Endpoint:** GET http://localhost:3000/api/projects

**Headers:**
```
Authorization: Bearer <Bob's token>
```

**Expected Response:** 200 OK
- List of all open projects
- Should see Alice's projects

#### Test Case 3.3: View Project Details
**Endpoint:** GET http://localhost:3000/api/projects/1

**Headers:**
```
Authorization: Bearer <Bob's token>
```

**Expected Response:** 200 OK
- Detailed project information
- Homeowner details

#### Test Case 3.4: Submit Proposal
**Endpoint:** POST http://localhost:3000/api/proposals

**Headers:**
```
Authorization: Bearer <Bob's token>
```

**Request:**
```json
{
  "project_id": 1,
  "proposed_price": 20000,
  "message": "I have 10 years of experience in kitchen renovations. I can complete this project in 6 weeks with high-quality materials."
}
```

**Expected Response:** 201 Created
- Proposal submitted successfully

#### Test Case 3.5: Try Submitting Duplicate Proposal (Should Fail)
**Endpoint:** POST http://localhost:3000/api/proposals

**Request:** Same as above

**Expected Response:** 409 Conflict
- Error: "You have already submitted a proposal for this project"

#### Test Case 3.6: View My Proposals
**Endpoint:** GET http://localhost:3000/api/proposals/my

**Headers:**
```
Authorization: Bearer <Bob's token>
```

**Expected Response:** 200 OK
- List of Bob's proposals
- Shows project details

---

### Scenario 4: Register Second Contractor

#### Test Case 4.1: Register Another Contractor
**Endpoint:** POST http://localhost:3000/api/auth/register

**Request:**
```json
{
  "name": "Charlie Davis",
  "email": "charlie@example.com",
  "password": "password123",
  "role": "Contractor"
}
```

Save Charlie's token.

#### Test Case 4.2: Charlie Submits Proposal
**Endpoint:** POST http://localhost:3000/api/proposals

**Headers:**
```
Authorization: Bearer <Charlie's token>
```

**Request:**
```json
{
  "project_id": 1,
  "proposed_price": 22000,
  "message": "Experienced contractor with excellent references. Can start immediately."
}
```

**Expected Response:** 201 Created

---

### Scenario 5: Review and Accept Proposals (Homeowner)

#### Test Case 5.1: View Proposals for Project
**Endpoint:** GET http://localhost:3000/api/proposals/project/1

**Headers:**
```
Authorization: Bearer <Alice's token>
```

**Expected Response:** 200 OK
- List of all proposals for project 1
- Should see proposals from Bob and Charlie
- Shows contractor names and verification status

#### Test Case 5.2: Accept a Proposal
**Endpoint:** PUT http://localhost:3000/api/proposals/1/accept

**Headers:**
```
Authorization: Bearer <Alice's token>
```

**Expected Response:** 200 OK
- Proposal accepted successfully

#### Test Case 5.3: Verify Proposal Status Updates
**Endpoint:** GET http://localhost:3000/api/proposals/project/1

**Headers:**
```
Authorization: Bearer <Alice's token>
```

**Expected Response:**
- Bob's proposal status: "Accepted"
- Charlie's proposal status: "Rejected"

#### Test Case 5.4: Verify Project Status
**Endpoint:** GET http://localhost:3000/api/projects/1

**Expected Response:**
- Project status should be "Accepted"

---

### Scenario 6: Admin Functions

#### Test Case 6.1: Login as Admin
**Endpoint:** POST http://localhost:3000/api/auth/login

**Request:**
```json
{
  "email": "admin@buildora.com",
  "password": "admin123"
}
```

Save admin token.

#### Test Case 6.2: View All Users
**Endpoint:** GET http://localhost:3000/api/admin/users

**Headers:**
```
Authorization: Bearer <Admin's token>
```

**Expected Response:** 200 OK
- List of all users
- Should see Alice, Bob, Charlie, and Admin

#### Test Case 6.3: Verify Contractor
**Endpoint:** PUT http://localhost:3000/api/admin/verify/2

**Headers:**
```
Authorization: Bearer <Admin's token>
```

**Expected Response:** 200 OK
- Bob is now verified

#### Test Case 6.4: View Platform Statistics
**Endpoint:** GET http://localhost:3000/api/admin/stats

**Headers:**
```
Authorization: Bearer <Admin's token>
```

**Expected Response:** 200 OK
- User counts by role
- Project counts by status
- Proposal counts by status
- Verified contractors count

---

### Scenario 7: Authorization Testing

#### Test Case 7.1: Contractor Tries to Create Project (Should Fail)
**Endpoint:** POST http://localhost:3000/api/projects

**Headers:**
```
Authorization: Bearer <Bob's token>
```

**Request:**
```json
{
  "title": "Test Project",
  "description": "This should fail",
  "budget_min": 1000,
  "budget_max": 2000,
  "location": "Test"
}
```

**Expected Response:** 403 Forbidden
- Error: "Required role: Homeowner"

#### Test Case 7.2: Homeowner Tries to Submit Proposal (Should Fail)
**Endpoint:** POST http://localhost:3000/api/proposals

**Headers:**
```
Authorization: Bearer <Alice's token>
```

**Request:**
```json
{
  "project_id": 1,
  "proposed_price": 10000,
  "message": "This should fail"
}
```

**Expected Response:** 403 Forbidden
- Error: "Required role: Contractor"

#### Test Case 7.3: Access Without Token (Should Fail)
**Endpoint:** GET http://localhost:3000/api/projects

**Headers:** (No Authorization header)

**Expected Response:** 401 Unauthorized
- Error: "Access denied. No token provided."

---

### Scenario 8: Delete Operations

#### Test Case 8.1: Contractor Withdraws Proposal
**Endpoint:** DELETE http://localhost:3000/api/proposals/2

**Headers:**
```
Authorization: Bearer <Charlie's token>
```

**Expected Response:** 200 OK
- Charlie's rejected proposal is deleted

#### Test Case 8.2: Homeowner Deletes Project (Should Fail - Has Accepted Proposal)
**Endpoint:** DELETE http://localhost:3000/api/projects/1

**Headers:**
```
Authorization: Bearer <Alice's token>
```

**Expected Response:** 400 Bad Request
- Error: "Cannot delete project with accepted proposals"

#### Test Case 8.3: Homeowner Deletes Project Without Accepted Proposals
**Endpoint:** DELETE http://localhost:3000/api/projects/2

**Headers:**
```
Authorization: Bearer <Alice's token>
```

**Expected Response:** 200 OK
- Project deleted successfully

---

## Using Postman for Testing

1. **Import Collection**: Create a new collection called "Buildora API"

2. **Set Variables**:
   - `base_url`: http://localhost:3000
   - `homeowner_token`: (paste token after Alice logs in)
   - `contractor_token`: (paste token after Bob logs in)
   - `admin_token`: (paste token after admin logs in)

3. **Authorization**: For protected endpoints, select "Bearer Token" and use `{{homeowner_token}}`, `{{contractor_token}}`, or `{{admin_token}}`

---

## Demo Presentation Script

For your Sprint 1 review, follow this flow:

1. **Show Database Schema** (2 minutes)
   - Open pgAdmin or DBeaver
   - Show the three tables: users, projects, proposals
   - Point out foreign keys and relationships

2. **API Demonstration** (5 minutes)
   - Register users (show Postman request/response)
   - Create project as homeowner
   - Browse projects as contractor
   - Submit proposals
   - Accept proposal as homeowner

3. **Security Features** (2 minutes)
   - Show JWT authentication
   - Demonstrate role-based authorization (contractor can't create projects)
   - Show password hashing in database

4. **Answer Technical Questions** (1 minute)
   - Be ready to explain your routes
   - Know where middleware is defined
   - Understand the proposal acceptance transaction

---

## Common Issues & Solutions

### Issue: "connect ECONNREFUSED"
**Solution**: PostgreSQL is not running. Start PostgreSQL service.

### Issue: "password authentication failed"
**Solution**: Check your DATABASE_URL in .env file. Make sure password is correct.

### Issue: "relation does not exist"
**Solution**: Run `npm run init-db` to create tables.

### Issue: "token expired"
**Solution**: Login again to get a new token. Tokens expire after 7 days.

---

## Success Criteria Checklist

✓ Database with 3 related entities (Users, Projects, Proposals)
✓ RESTful API endpoints for all CRUD operations
✓ JWT authentication with bcrypt password hashing
✓ Role-based authorization (Homeowner, Contractor, Admin)
✓ Input validation with express-validator
✓ Proper error handling
✓ Foreign key relationships enforced
✓ Transaction handling (proposal acceptance)
✓ Code is well-organized and commented
✓ README with setup instructions
✓ API documentation

You're ready to present! 🎉
