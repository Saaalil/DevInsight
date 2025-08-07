# DevInsight Backend API

This is the backend API for the DevInsight application, which provides GitHub repository analytics and insights.

## Technologies Used

- Node.js
- Express.js
- TypeScript
- MongoDB with Mongoose
- JWT Authentication
- GitHub OAuth
- Nodemailer for email reports
- Node-cron for scheduled tasks

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- GitHub OAuth App credentials

### Installation

1. Clone the repository
2. Navigate to the backend directory
   ```bash
   cd DevInsight/backend
   ```
3. Install dependencies
   ```bash
   npm install
   ```
4. Create a `.env` file based on `.env.example` and fill in your configuration
5. Build the TypeScript code
   ```bash
   npm run build
   ```
6. Start the server
   ```bash
   npm start
   ```

### Development Mode

To run the server in development mode with hot reloading:

```bash
npm run dev
```

## API Endpoints

### Authentication

- `GET /api/auth/github` - Redirect to GitHub OAuth
- `GET /api/auth/github/callback` - GitHub OAuth callback
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/logout` - Logout user

### User

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `DELETE /api/user/account` - Delete user account

### Repositories

- `GET /api/repo` - Get user's GitHub repositories
- `GET /api/repo/connected` - Get user's connected repositories
- `GET /api/repo/:id` - Get repository details
- `POST /api/repo/connect` - Connect a repository
- `DELETE /api/repo/:id` - Disconnect a repository

### Reports

- `GET /api/report/settings` - Get report settings
- `PUT /api/report/settings` - Update report settings
- `GET /api/report` - Get all reports for a user
- `GET /api/report/:id` - Get a specific report
- `POST /api/report/generate/:repoId` - Generate a report for a repository
- `GET /api/report/:id/export` - Export report as CSV

### Alerts

- `GET /api/alert` - Get all alerts for a user
- `GET /api/alert/:id` - Get a specific alert
- `PUT /api/alert/:id/status` - Update alert status
- `POST /api/alert/configure/:repoId` - Configure alert thresholds

## Environment Variables

See `.env.example` for required environment variables.

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Express middleware
├── models/         # Mongoose models
├── routes/         # Express routes
├── services/       # Business logic
├── utils/          # Utility functions
└── server.ts       # Entry point
```

## License

MIT