# FairShare - Shared Expense Tracker & Settlement System

A full-stack web application for tracking shared expenses and managing settlements, similar to Splitwise.

## 🏗️ Architecture

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **DB Driver**: mysql2 (no ORM)
- **Authentication**: JWT (Access + Refresh Tokens)
- **Architecture**: Layered MVC

### Frontend
- **Framework**: React
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **Routing**: React Router
- **API Calls**: Axios

## 📁 Project Structure

```
FairShare/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request/response handlers
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Database queries
│   │   ├── routes/         # API routes
│   │   ├── middlewares/    # Auth, error handling
│   │   ├── validations/    # Input validation
│   │   ├── utils/          # JWT, helpers, algorithms
│   │   └── db/             # Database connection & schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── services/       # API service functions
│   │   ├── context/        # React Context (Auth)
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Helper functions
│   └── package.json
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v8 or higher)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your MySQL credentials:
```
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fairshare
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

5. Create MySQL database:
```sql
CREATE DATABASE fairshare;
```

6. Run the schema SQL:
```bash
mysql -u root -p fairshare < src/db/schema.sql
```

7. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token

### Users
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/search?q=query` - Search users

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - Get user's groups
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/:id/members` - Add member
- `DELETE /api/groups/:id/members/:userId` - Remove member
- `PATCH /api/groups/:id/members/:userId/role` - Update member role

### Expenses
- `POST /api/groups/:id/expenses` - Create expense
- `GET /api/groups/:id/expenses` - Get group expenses

### Balances
- `GET /api/groups/:id/balances` - Get group balances

### Settlements
- `POST /api/groups/:id/settlements` - Record settlement
- `GET /api/groups/:id/settlements` - Get settlement history
- `GET /api/groups/:id/optimize-settlements` - Get optimized settlement suggestions

### Timeline
- `GET /api/groups/:id/timeline` - Get unified activity timeline

## 🎯 Features

### Backend Features
- ✅ User registration & authentication with JWT
- ✅ Group creation & member management
- ✅ Expense tracking with flexible splits (equal, exact, percentage)
- ✅ Ledger system for balance tracking
- ✅ Manual settlements with validation
- ✅ Cash flow optimization algorithm
- ✅ Unified activity timeline
- ✅ Transaction-safe database operations
- ✅ Proper error handling & validation

### Frontend Features
- ✅ User authentication (Login/Register)
- ✅ Dashboard with groups list
- ✅ Group detail page with tabs:
  - Expenses (add/view expenses)
  - Balances (view who owes whom)
  - Settlements (optimized suggestions & history)
  - Timeline (unified activity feed)
- ✅ Add expense form with dynamic split inputs
- ✅ Settle up functionality
- ✅ Responsive design with Tailwind CSS
- ✅ Loading & error states
- ✅ Token refresh handling

## 🔐 Security Features

- Password hashing with bcrypt
- JWT access tokens (short-lived)
- JWT refresh tokens (long-lived)
- Token rotation on refresh
- Protected routes middleware
- Input validation & sanitization
- SQL injection prevention (parameterized queries)
- Helmet for secure HTTP headers
- Rate limiting (global + stricter on auth routes)
- CORS configurable via `CORS_ORIGIN`
- No stack traces or internal details in production API responses

## 💰 Financial Accuracy

- Uses DECIMAL type for money storage
- MySQL transactions for atomic operations
- Balance normalization
- Prevents over-settlement
- Validates split totals match expense amounts
- Handles floating-point precision issues

## 🧮 Cash Flow Optimization

The system includes a minimal cash flow optimization algorithm that:
- Calculates net balances for each user
- Minimizes the number of settlement transactions
- Provides suggestions for optimal settlement paths

## 📝 Notes

- All money values use DECIMAL(10, 2) for precision
- Ledger balances are normalized automatically
- Settlements are immutable (history only)
- Group admins can manage members
- All operations are transaction-safe

## 🛠️ Development

### Backend
- Run in development mode: `npm run dev` (with auto-reload)
- Run in production: `npm start`

### Frontend
- Development server: `npm run dev`
- Build for production: `npm run build`
- Preview production build: `npm run preview`

## 🚀 Production Deployment

### Backend

1. Set `NODE_ENV=production`.
2. Use a process manager (e.g. PM2): `pm2 start src/server.js --name fairshare-api`.
3. Configure `.env` for production:
   - Strong `JWT_SECRET` and `JWT_REFRESH_SECRET` (long random strings).
   - `CORS_ORIGIN`: set to your frontend origin(s), e.g. `https://app.yourdomain.com` (comma-separated for multiple).
   - Database: use production DB host, user, and password.
3. Run database migrations (schema) on the production DB.
4. Put the app behind a reverse proxy (e.g. Nginx) with HTTPS; optionally proxy `/api` to the Node app.

### Frontend

1. Build: `npm run build` (output in `dist/`).
2. Set `VITE_API_URL` to your backend API base URL (e.g. `https://api.yourdomain.com`) so requests go to the correct host. Leave empty only if the same origin serves both (e.g. Nginx serves `/` from `dist/` and proxies `/api` to the backend).
3. Serve `dist/` with a static server or Nginx (SPA fallback: all routes to `index.html`).

### Environment summary

| Variable | Backend | Frontend | Description |
|----------|---------|----------|-------------|
| `NODE_ENV` | ✅ | - | `production` / `development` |
| `PORT` | ✅ | - | Server port |
| `DB_*` | ✅ | - | MySQL connection |
| `JWT_*` | ✅ | - | JWT secrets and expiry |
| `CORS_ORIGIN` | ✅ | - | Allowed origins (comma-separated or `*`) |
| `VITE_API_URL` | - | ✅ | API base URL (optional; use in production if API on different host) |
| `VITE_API_TIMEOUT` | - | Optional | Request timeout in ms (default 15000) |

## 📄 License

ISC
