# Buildora - Home Renovation Project Matching Platform

A full-stack web application connecting homeowners with contractors for renovation projects.

## Features

- **User Authentication**: Secure JWT-based authentication with bcrypt password hashing
- **Role-Based Access**: Separate workflows for Homeowners, Contractors, and Admins
- **Project Management**: Homeowners can post and manage renovation projects
- **Proposal System**: Contractors can browse projects and submit proposals
- **Admin Controls**: Verify contractors and manage users

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT, bcrypt
- **Validation**: express-validator

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd buildora-backend
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/buildora
JWT_SECRET=your_super_secret_key_change_this_in_production
```

4. Initialize the database
```bash
npm run init-db
```

5. Start the server
```bash
npm run dev
```

The server will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Projects
- `POST /api/projects` - Create new project (Homeowner only)
- `GET /api/projects` - List all open projects
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Proposals
- `POST /api/proposals` - Submit proposal (Contractor only)
- `GET /api/proposals/project/:id` - Get proposals for a project
- `PUT /api/proposals/:id/accept` - Accept proposal (Homeowner only)
- `DELETE /api/proposals/:id` - Delete proposal

### Admin
- `PUT /api/admin/verify/:userId` - Verify contractor
- `PUT /api/admin/deactivate/:userId` - Deactivate user

## Database Schema

### Users
- user_id (PK)
- name
- email (unique)
- password_hash
- role (Homeowner/Contractor/Admin)
- is_verified
- created_at

### Projects
- project_id (PK)
- homeowner_id (FK → Users)
- title
- description
- budget_min
- budget_max
- location
- status (Open/Accepted/Closed)
- created_at

### Proposals
- proposal_id (PK)
- project_id (FK → Projects)
- contractor_id (FK → Users)
- proposed_price
- message
- status (Pending/Accepted/Rejected)
- created_at

## Author

Jeel Amrutbhai Patel

## License

ISC
