# Buildora API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Register New User
**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Homeowner"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIm5hbWUiOiJKb2huIERvZSIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInJvbGUiOiJIb21lb3duZXIiLCJpYXQiOjE2NzY1NDEyMDB9.signature",
  "user": {
    "userId": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Homeowner",
    "isVerified": false
  }
}
```

---

### Login
**POST** `/api/auth/login`

Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIm5hbWUiOiJKb2huIERvZSIsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInJvbGUiOiJIb21lb3duZXIiLCJpYXQiOjE2NzY1NDEyMDB9.signature",
  "user": {
    "userId": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Homeowner",
    "isVerified": false
  }
}
```

---

## Project Endpoints

### Create Project
**POST** `/api/projects`

Create a new renovation project (Homeowner only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Kitchen Renovation",
  "description": "Complete kitchen remodel with new cabinets and countertops",
  "budget_min": 15000,
  "budget_max": 25000,
  "location": "Toronto, ON"
}
```

**Response:** `201 Created`
```json
{
  "message": "Project created successfully",
  "project": {
    "project_id": 1,
    "homeowner_id": 1,
    "title": "Kitchen Renovation",
    "description": "Complete kitchen remodel with new cabinets and countertops",
    "budget_min": 15000,
    "budget_max": 25000,
    "location": "Toronto, ON",
    "status": "Open",
    "created_at": "2026-02-04T10:30:00.000Z"
  }
}
```

---

### List All Open Projects
**GET** `/api/projects`

Get all open projects (accessible to all authenticated users).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "projects": [
    {
      "project_id": 1,
      "homeowner_id": 1,
      "homeowner_name": "John Doe",
      "homeowner_email": "john@example.com",
      "title": "Kitchen Renovation",
      "description": "Complete kitchen remodel with new cabinets and countertops",
      "budget_min": 15000,
      "budget_max": 25000,
      "location": "Toronto, ON",
      "status": "Open",
      "created_at": "2026-02-04T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### Get My Projects
**GET** `/api/projects/my`

Get all projects created by the current homeowner.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "projects": [
    {
      "project_id": 1,
      "title": "Kitchen Renovation",
      "description": "Complete kitchen remodel with new cabinets and countertops",
      "budget_min": 15000,
      "budget_max": 25000,
      "location": "Toronto, ON",
      "status": "Open",
      "proposal_count": 3,
      "created_at": "2026-02-04T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### Get Project Details
**GET** `/api/projects/:id`

Get detailed information about a specific project.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "project": {
    "project_id": 1,
    "homeowner_id": 1,
    "homeowner_name": "John Doe",
    "homeowner_email": "john@example.com",
    "title": "Kitchen Renovation",
    "description": "Complete kitchen remodel with new cabinets and countertops",
    "budget_min": 15000,
    "budget_max": 25000,
    "location": "Toronto, ON",
    "status": "Open",
    "created_at": "2026-02-04T10:30:00.000Z"
  }
}
```

---

### Update Project
**PUT** `/api/projects/:id`

Update project details (Owner only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated Kitchen Renovation",
  "description": "Updated description",
  "budget_min": 18000,
  "budget_max": 28000,
  "location": "Toronto, ON",
  "status": "Open"
}
```

**Response:** `200 OK`

---

### Delete Project
**DELETE** `/api/projects/:id`

Delete a project (Owner only, no accepted proposals).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Project deleted successfully"
}
```

---

## Proposal Endpoints

### Submit Proposal
**POST** `/api/proposals`

Submit a proposal for a project (Contractor only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "project_id": 1,
  "proposed_price": 20000,
  "message": "I have 10 years of experience in kitchen renovations..."
}
```

**Response:** `201 Created`
```json
{
  "message": "Proposal submitted successfully",
  "proposal": {
    "proposal_id": 1,
    "project_id": 1,
    "contractor_id": 2,
    "proposed_price": 20000,
    "message": "I have 10 years of experience in kitchen renovations and have completed 50+ projects",
    "status": "Pending",
    "created_at": "2026-02-04T11:00:00.000Z"
  }
}
```

---

### Get Proposals for Project
**GET** `/api/proposals/project/:id`

Get all proposals for a specific project (Homeowner only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "proposals": [
    {
      "proposal_id": 1,
      "project_id": 1,
      "contractor_id": 2,
      "contractor_name": "Jane Smith",
      "contractor_email": "jane@example.com",
      "is_verified": true,
      "proposed_price": 20000,
      "message": "I have 10 years of experience in kitchen renovations and have completed 50+ projects",
      "status": "Pending",
      "created_at": "2026-02-04T11:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### Get My Proposals
**GET** `/api/proposals/my`

Get all proposals submitted by the current contractor.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "proposals": [
    {
      "proposal_id": 1,
      "project_id": 1,
      "project_title": "Kitchen Renovation",
      "project_description": "Complete kitchen remodel with new cabinets and countertops",
      "project_location": "Toronto, ON",
      "project_status": "Open",
      "proposed_price": 20000,
      "status": "Pending",
      "created_at": "2026-02-04T11:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### Accept Proposal
**PUT** `/api/proposals/:id/accept`

Accept a proposal (Homeowner only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Proposal accepted successfully",
  "proposalId": 1
}
```

**Side Effects:**
- Sets the proposal status to "Accepted"
- Rejects all other proposals for the project
- Updates project status to "Accepted"

---

### Withdraw Proposal
**DELETE** `/api/proposals/:id`

Withdraw a pending proposal (Contractor only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Proposal withdrawn successfully"
}
```

---

## Admin Endpoints

### Verify Contractor
**PUT** `/api/admin/verify/:userId`

Verify a contractor account (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Contractor verified successfully"
}
```

---

### Deactivate User
**PUT** `/api/admin/deactivate/:userId`

Deactivate a user account (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "User deactivated successfully"
}
```

---

### Get All Users
**GET** `/api/admin/users`

Get list of all users (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "users": [
    {
      "user_id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Homeowner",
      "is_verified": false,
      "created_at": "2026-02-04T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### Get Platform Statistics
**GET** `/api/admin/stats`

Get platform statistics (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "stats": {
    "users": [
      { "role": "Homeowner", "count": 10 },
      { "role": "Contractor", "count": 15 },
      { "role": "Admin", "count": 1 }
    ],
    "projects": [
      { "status": "Open", "count": 5 },
      { "status": "Accepted", "count": 3 },
      { "status": "Closed", "count": 2 }
    ],
    "proposals": [
      { "status": "Pending", "count": 8 },
      { "status": "Accepted", "count": 3 },
      { "status": "Rejected", "count": 5 }
    ],
    "verifiedContractors": 12
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "error": "Access denied. Required role: Homeowner"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Email already registered"
}
```

### 500 Internal Server Error
```json
{
  "error": "Server error message"
}
```
