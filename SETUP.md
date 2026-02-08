# Quick Setup Guide

## Prerequisites
- Node.js (v18+)
- PostgreSQL (v12+)

## Step-by-Step Setup

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb fairshare
# Or using psql:
# psql -U postgres -c "CREATE DATABASE fairshare;"

# Run schema (from backend directory)
cd backend
psql -U postgres -d fairshare -f src/db/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your PostgreSQL credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_NAME=fairshare
# JWT_SECRET=your-random-secret-key
# JWT_REFRESH_SECRET=your-random-refresh-secret-key

# Start backend server
npm run dev
```

Backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Start frontend dev server
npm run dev
```

Frontend will run on `http://localhost:3000`

### 4. Access the Application

1. Open browser to `http://localhost:3000`
2. Register a new account
3. Create your first group
4. Add expenses and track balances!

## Testing the Application

1. **Create Multiple Users**: Register 2-3 test accounts
2. **Create a Group**: From dashboard, create a new group
3. **Add Members**: Click "Add Member" and search for other users
4. **Add Expenses**: Go to Expenses tab, add an expense with splits
5. **View Balances**: Check the Balances tab to see who owes whom
6. **Settle Up**: Record settlements from the Balances tab
7. **View Timeline**: See all activity in chronological order
8. **Optimized Settlements**: Check Settlements tab for suggestions

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `psql -U postgres -c "SELECT 1"`
- Verify database exists: `psql -U postgres -l`
- Check .env file has correct credentials
- Ensure port 3001 is not in use

### Frontend won't start
- Check Node.js version: `node --version` (should be 18+)
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check port 3000 is not in use

### Database connection errors
- Verify PostgreSQL is running
- Check .env file credentials (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)
- Ensure database `fairshare` exists
- Run schema.sql if tables are missing

### CORS errors
- Ensure backend is running on port 3001
- Check frontend proxy config in vite.config.js
- Verify API calls use `/api` prefix

## Production Build

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve the dist/ folder with a web server
```

## API Testing

You can test the API directly using curl or Postman:

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Use the returned `accessToken` in subsequent requests:
```bash
curl -X GET http://localhost:3001/api/groups \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
