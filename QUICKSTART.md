# Quick Start Guide

## 5-Minute Setup

### Step 1: Setup Backend (2 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
copy .env.example .env

# Start backend server
npm start
```

✅ Backend running on http://localhost:5000

### Step 2: Setup Frontend (2 minutes)

```bash
# Open new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
copy .env.example .env

# Start frontend
npm start
```

✅ Frontend running on http://localhost:3000

### Step 3: Create Test Account (1 minute)

1. Click "Register" on the login page
2. Fill in test credentials:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
3. Click Register

✅ You're logged in!

## Test the Features

### Create a Client
1. Click "Clients" in navigation
2. Click "+ Add New Client"
3. Fill in:
   - Company: `Acme Corp`
   - Contact: `John Doe`
   - Email: `john@acme.com`
   - Status: `prospect`
4. Click "Save Client"

### Create a Lead
1. Click "Leads"
2. Click "+ Add New Lead"
3. Fill in:
   - First Name: `Jane`
   - Last Name: `Smith`
   - Email: `jane@example.com`
   - Company: `Tech Startup`
   - Source: `website`
   - Value: `5000`
   - Probability: `75`
4. Click "Save Lead"

### Create a Task
1. Click "Tasks"
2. Click "+ Add New Task"
3. Fill in:
   - Title: `Follow up with client`
   - Priority: `high`
   - Due Date: `Tomorrow`
4. Click "Save Task"

### View Dashboard
1. Click "Dashboard"
2. See statistics and recent items
3. Click on any stat card to filter items

## Common Issues & Solutions

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running
```bash
# Windows
# MongoDB should auto-start, if not start it manually from Services

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongodb
```

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution:** Change PORT in backend .env or kill the process using the port

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Make sure backend is running and FRONTEND_URL is correct in .env

### Token Expired
- Clear browser localStorage
- Log out and log back in
- Frontend will automatically request new token

## Development Tips

### Hot Reload
- Backend: nodemon automatically restarts on file changes
- Frontend: React dev server auto-refreshes on save

### Debug with Browser DevTools
1. Open Chrome DevTools (F12)
2. Network tab: See API requests
3. Application tab: Check localStorage for token
4. Console tab: See error messages

### Database Inspection
```bash
# Open MongoDB shell
mongosh

# Select database
use crm_db

# View collections
show collections

# See user data
db.users.find()

# See clients
db.clients.find()
```

## Next Steps

1. **Add More Test Data**: Create multiple clients and leads
2. **Explore Filtering**: Try search and status filters
3. **Test All Features**: Try all CRUD operations
4. **Check Responsive Design**: Resize browser to test mobile view
5. **Review Code**: Familiarize yourself with the architecture

## Getting Help

### Check the Logs
- **Backend**: Check terminal for server logs
- **Frontend**: Check browser console (F12)
- **MongoDB**: Check MongoDB logs

### Common Errors

**1. "User not found"**
- Your JWT token is invalid
- Clear localStorage and login again

**2. "Email already exists"**
- That email is already registered
- Use a different email or clear the database

**3. "Invalid token"**
- Your session expired
- Refresh the page and login again

**4. Empty tables**
- No data created yet
- Follow the "Test the Features" section to add data

## Production Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to a random string (32+ characters)
- [ ] Set NODE_ENV=production
- [ ] Use MongoDB Atlas instead of local MongoDB
- [ ] Enable HTTPS
- [ ] Set correct FRONTEND_URL in backend .env
- [ ] Set correct REACT_APP_API_URL in frontend .env
- [ ] Run npm build for frontend
- [ ] Set up environment variables on hosting platform
- [ ] Test all features in production
- [ ] Set up error monitoring
- [ ] Configure backups
- [ ] Enable CORS only for your domain

## Performance Tips

1. **Lazy Load Pages**: Reduce initial bundle size
2. **Optimize Images**: Compress profile pictures
3. **Use Pagination**: Don't load all data at once
4. **Index Database**: Add indexes for frequently searched fields
5. **Enable Caching**: Cache API responses when appropriate
6. **Use CDN**: Serve static assets from CDN

## Extending the Application

### Add a New Feature

1. **Create Backend Model** (e.g., `backend/models/NewFeature.js`)
2. **Create Controller** (e.g., `backend/controllers/newFeatureController.js`)
3. **Create Routes** (e.g., `backend/routes/newFeatureRoutes.js`)
4. **Add to Server** (register routes in `server.js`)
5. **Create Frontend Pages** (e.g., `frontend/src/pages/NewFeature.js`)
6. **Create Frontend Service** (add to `frontend/src/services/index.js`)
7. **Update Navigation** (add link in Navigation.js)
8. **Test**: Create, read, update, delete operations

### Example: Add "Projects" Feature

```bash
# Backend
# 1. Create model: backend/models/Project.js
# 2. Create controller: backend/controllers/projectController.js
# 3. Create routes: backend/routes/projectRoutes.js
# 4. Add to server.js: app.use('/api/projects', projectRoutes);

# Frontend
# 1. Create page: frontend/src/pages/Projects.js
# 2. Add service in frontend/src/services/index.js
# 3. Add route in App.js
# 4. Add nav link in Navigation.js
```

## Resources

- [Express.js Documentation](https://expressjs.com)
- [React Documentation](https://react.dev)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Mongoose Documentation](https://mongoosejs.com)
- [JWT Guide](https://jwt.io/introduction)

Happy coding! 🚀
