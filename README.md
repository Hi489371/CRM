# CRM System - Complete Application

A full-featured Customer Relationship Management (CRM) web application built with React, Node.js, Express, and MongoDB. Designed to help freelance developers manage clients, leads, tasks, and notes efficiently.

## Features

### Core Features
- ✅ User Authentication (Login/Register with JWT)
- ✅ Dashboard with Overview Statistics
- ✅ Client Management (Add, Edit, Delete, View)
- ✅ Lead Management with Status Tracking
- ✅ Task Management (Assign, Track, Update Status)
- ✅ Notes/Comments for Clients and Leads
- ✅ Search and Filter Functionality
- ✅ Role-Based Access Control (Admin, User)
- ✅ Responsive UI (Desktop & Mobile)
- ✅ Activity Feed

### Dashboard Features
- Total clients, leads, and tasks overview
- Recent clients and leads
- Task statistics by status
- Lead statistics
- Revenue tracking
- Overdue tasks alert

### Admin Features
- User management
- View all users
- Update user roles and status
- Deactivate users

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, helmet, CORS

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Styling**: CSS3

## Project Structure

```
crm/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Client.js
│   │   ├── Lead.js
│   │   ├── Task.js
│   │   ├── Note.js
│   │   └── index.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── clientRoutes.js
│   │   ├── leadRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── noteRoutes.js
│   │   └── dashboardRoutes.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── clientController.js
│   │   ├── leadController.js
│   │   ├── taskController.js
│   │   ├── noteController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── authorize.js
│   │   └── errorHandler.js
│   ├── config/
│   │   └── database.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── Navigation.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── Auth.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Clients.js
│   │   │   ├── Leads.js
│   │   │   └── Tasks.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── index.js
│   │   ├── styles/
│   │   │   ├── Global.css
│   │   │   ├── Auth.css
│   │   │   ├── Dashboard.css
│   │   │   ├── Navigation.css
│   │   │   ├── Clients.css
│   │   │   ├── Leads.css
│   │   │   └── Tasks.css
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas)

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create .env file:**
```bash
cp .env.example .env
```

4. **Configure environment variables in .env:**
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/crm_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=http://localhost:3000
```

5. **Start MongoDB:**
```bash
# If using local MongoDB
mongod
```

6. **Run the backend server:**
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create .env file:**
```bash
cp .env.example .env
```

4. **Configure environment variables in .env:**
```
REACT_APP_API_URL=http://localhost:5000/api
```

5. **Start the frontend development server:**
```bash
npm start
```

The frontend will run on `http://localhost:3000` and automatically open in your browser.

## Database Setup

### MongoDB Local Installation

**On Windows:**
1. Download MongoDB Community Edition
2. Install and follow the setup wizard
3. MongoDB will run as a service by default

**On Mac:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**On Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

### MongoDB Atlas (Cloud)

1. Create account at [mongodb.com](https://www.mongodb.com)
2. Create a cluster
3. Get connection string
4. Update MONGODB_URI in backend .env:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crm_db
```

## API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Body: { name, email, password, phone }
```

#### Login
```
POST /api/auth/login
Body: { email, password }
```

#### Get Current User
```
GET /api/auth/me
Headers: { Authorization: Bearer <token> }
```

#### Update Profile
```
PUT /api/auth/me
Headers: { Authorization: Bearer <token> }
Body: { name, phone, department, profileImage }
```

#### Change Password
```
PUT /api/auth/change-password
Headers: { Authorization: Bearer <token> }
Body: { oldPassword, newPassword }
```

### Client Endpoints

```
POST   /api/clients              - Create client
GET    /api/clients              - Get all clients (with pagination/search)
GET    /api/clients/:id          - Get single client
PUT    /api/clients/:id          - Update client
DELETE /api/clients/:id          - Delete client
GET    /api/clients/stats        - Get client statistics
```

### Lead Endpoints

```
POST   /api/leads                - Create lead
GET    /api/leads                - Get all leads (with pagination/search)
GET    /api/leads/:id            - Get single lead
PUT    /api/leads/:id            - Update lead
DELETE /api/leads/:id            - Delete lead
POST   /api/leads/:id/convert    - Convert lead to client
GET    /api/leads/stats          - Get lead statistics
```

### Task Endpoints

```
POST   /api/tasks                - Create task
GET    /api/tasks                - Get all tasks (with filters)
GET    /api/tasks/:id            - Get single task
PUT    /api/tasks/:id            - Update task
DELETE /api/tasks/:id            - Delete task
GET    /api/tasks/stats          - Get task statistics
GET    /api/tasks/today          - Get today's tasks
```

### Note Endpoints

```
POST   /api/notes                - Create note
GET    /api/notes                - Get notes (filtered by client/lead)
GET    /api/notes/:id            - Get single note
PUT    /api/notes/:id            - Update note
DELETE /api/notes/:id            - Delete note
GET    /api/notes/activity/feed  - Get activity feed
```

### Dashboard Endpoints

```
GET /api/dashboard               - Get dashboard statistics
GET /api/dashboard/user          - Get user-specific dashboard
GET /api/dashboard/reports       - Get reports
```

## Default Admin Account

After first setup, create an admin user:

1. Register through the UI
2. Open MongoDB and update the user role:
```bash
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

## Common Tasks

### Add a New Client
1. Navigate to Clients page
2. Click "+ Add New Client"
3. Fill in the form
4. Click "Save Client"

### Create a Lead
1. Navigate to Leads page
2. Click "+ Add New Lead"
3. Set the source, value, and probability
4. Click "Save Lead"

### Assign a Task
1. Navigate to Tasks page
2. Click "+ Add New Task"
3. Set due date, priority, and assigned user
4. Click "Save Task"

### Search and Filter
- Use the search box to find clients/leads by name or email
- Use status filters to view specific categories
- Use date filters for tasks

## Deployment

### Backend Deployment (Heroku example)

1. Create Heroku account
2. Install Heroku CLI
3. In backend directory:
```bash
heroku login
heroku create your-app-name
heroku addons:create mongolab:sandbox
git push heroku main
```

### Frontend Deployment (Vercel example)

1. Create Vercel account
2. Connect your GitHub repository
3. Set environment variables
4. Deploy

## Troubleshooting

### Connection Issues
- Check if MongoDB is running
- Verify MONGODB_URI in .env
- Check if ports 5000 and 3000 are available

### Authentication Issues
- Clear localStorage and try again
- Verify JWT_SECRET is set in .env
- Check token expiration

### CORS Errors
- Ensure FRONTEND_URL is correct in backend .env
- Verify frontend is running on the correct port

### Module Not Found
- Delete node_modules and package-lock.json
- Run npm install again

## Development Guidelines

### Code Style
- Use const/let instead of var
- Use arrow functions
- Use async/await
- Add comments for complex logic

### Naming Conventions
- Files: camelCase (e.g., authController.js)
- Classes: PascalCase (e.g., AuthContext)
- Functions: camelCase (e.g., fetchClients)
- Constants: UPPER_SNAKE_CASE (e.g., API_BASE_URL)

### Git Workflow
1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and commit
3. Push to branch
4. Create pull request

## Future Enhancements

- Email notifications
- File uploads
- Calendar integration
- Pipeline visualization
- Advanced reporting
- Mobile app (React Native)
- Real-time collaboration (WebSockets)
- Custom fields per user
- Integration with external tools (Slack, Gmail)
- Export to CSV/PDF
- Bulk operations

## Security Considerations

- Always use HTTPS in production
- Use strong JWT secret (minimum 32 characters)
- Implement rate limiting
- Validate all user inputs
- Use environment variables for sensitive data
- Regularly update dependencies
- Implement CSRF protection
- Use helmet.js headers
- Implement request throttling

## License

MIT

## Support

For issues and questions, please create an issue in the repository.

## Authors

Built by freelance developers for freelance developers.
