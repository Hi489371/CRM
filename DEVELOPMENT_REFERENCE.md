# CRM Development Quick Reference

## File Locations & Purposes

### Backend Models (`backend/models/`)
| File | Purpose |
|------|---------|
| User.js | User authentication, profiles, roles |
| Client.js | Customer information |
| Lead.js | Sales opportunities |
| Task.js | Action items, reminders |
| Note.js | Comments, communications |

### Backend Controllers (`backend/controllers/`)
| File | Handles |
|------|---------|
| authController.js | Login, register, profile management |
| clientController.js | Client CRUD operations |
| leadController.js | Lead management |
| taskController.js | Task management |
| noteController.js | Notes and comments |
| dashboardController.js | Statistics and reports |

### Frontend Pages (`frontend/src/pages/`)
| File | Route(s) |
|------|---------|
| Auth.js | /login, /register |
| Dashboard.js | /dashboard |
| Clients.js | /clients, /clients/:id |
| Leads.js | /leads, /leads/:id |
| Tasks.js | /tasks, /tasks/:id |

---

## Common API Calls

### Authentication
```javascript
// Login
POST /api/auth/login
{ email, password }

// Register
POST /api/auth/register
{ name, email, password, phone }

// Get current user
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
```

### Clients
```javascript
// List with pagination and filters
GET /api/clients?page=1&limit=10&search=acme&status=active

// Create
POST /api/clients
{ companyName, contactName, email, phone, address, status }

// Update
PUT /api/clients/:id
{ updated fields }

// Delete
DELETE /api/clients/:id
```

### Leads
```javascript
// List with filters
GET /api/leads?page=1&status=new&source=website

// Create
POST /api/leads
{ firstName, lastName, email, company, value, probability }

// Update status
PUT /api/leads/:id
{ status: "converted" }
```

### Tasks
```javascript
// List with filters
GET /api/tasks?status=todo&priority=high

// Create
POST /api/tasks
{ title, dueDate, priority, assignedTo }

// Update status
PUT /api/tasks/:id
{ status: "completed" }

// Get today's tasks
GET /api/tasks/today
```

---

## Frontend Service Usage

### Import Services
```javascript
import { 
  authService, 
  clientService, 
  leadService, 
  taskService, 
  noteService, 
  dashboardService 
} from '../services';
```

### Use in Components
```javascript
// Get data
const data = await clientService.getClients({ 
  page: 1, 
  search: 'acme' 
});

// Create
await clientService.createClient(formData);

// Update
await clientService.updateClient(id, updatedData);

// Delete
await clientService.deleteClient(id);
```

---

## Component Patterns

### Functional Component with State
```javascript
import { useState, useEffect } from 'react';
import { serviceMethod } from '../services';

export const MyComponent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await serviceMethod();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return <div>{/* component JSX */}</div>;
};
```

### Using Auth Context
```javascript
import { useAuth } from '../context/AuthContext';

export const MyComponent = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div>
      {isAuthenticated && <p>Welcome, {user.name}</p>}
    </div>
  );
};
```

### Form Component
```javascript
const [formData, setFormData] = useState(initialData);

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData({ ...formData, [name]: value });
};

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await serviceMethod(formData);
    // success handling
  } catch (err) {
    // error handling
  }
};

return (
  <form onSubmit={handleSubmit}>
    <input name="field" value={formData.field} onChange={handleChange} />
    <button type="submit">Submit</button>
  </form>
);
```

---

## Routing Examples

### Add New Page
```javascript
// 1. Create page component
export const NewPage = () => { /* ... */ };

// 2. Add import in App.js
import { NewPage } from './pages/NewPage';

// 3. Add route in App.js
<Route path="/newpage" element={<PrivateRoute><NewPage /></PrivateRoute>} />

// 4. Add navigation link in Navigation.js
<Link to="/newpage" className="nav-link">New Page</Link>
```

---

## Environment Variables

### Backend `.env`
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/crm_db
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env`
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## MongoDB Queries

### Connect to Local MongoDB
```bash
mongosh
use crm_db
```

### Common Queries
```javascript
// Find all users
db.users.find()

// Find active clients
db.clients.find({ status: "active" })

// Find leads in a value range
db.leads.find({ value: { $gte: 5000, $lte: 50000 } })

// Count tasks by status
db.tasks.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// Update user role
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

---

## Status Values

### Lead Status
- `new` - Not contacted
- `contacted` - Initial contact made
- `qualified` - Qualified opportunity
- `proposal` - Proposal sent
- `converted` - Became a client
- `lost` - Lost opportunity

### Client Status
- `prospect` - Potential client
- `active` - Current client
- `inactive` - Inactive client

### Task Status
- `todo` - Not started
- `in-progress` - Being worked on
- `completed` - Finished
- `cancelled` - Not needed

### Task Priority
- `low` - Can wait
- `medium` - Important
- `high` - Urgent
- `urgent` - Highest priority

---

## CSS Classes

### Button Styles
```html
<button class="btn-primary">Primary</button>
<button class="btn-secondary">Secondary</button>
<button class="btn-danger">Danger</button>
<button class="btn-small">Small</button>
```

### Status Badges
```html
<span class="status-badge active">active</span>
<span class="status-badge prospect">prospect</span>
<span class="status-badge converted">converted</span>
```

### Priority Badges
```html
<span class="priority-badge low">Low</span>
<span class="priority-badge high">High</span>
<span class="priority-badge urgent">Urgent</span>
```

---

## Error Handling

### Backend (Express)
```javascript
try {
  // Do something
  next(error);
} catch (error) {
  next(error); // Goes to errorHandler middleware
}
```

### Frontend (React)
```javascript
try {
  const result = await apiCall();
  setData(result);
} catch (err) {
  setError(err.response?.data?.message || 'Error');
}
```

---

## Debugging Tips

### Backend
```javascript
// Console logging
console.log('Value:', someVar);

// Check request
console.log('Request:', req.body);

// Check MongoDB connection
// Check server logs in terminal
```

### Frontend
```javascript
// Browser DevTools (F12)
// Network tab: See API calls
// Console tab: JavaScript errors
// Application tab: localStorage (token)

// React DevTools extension
// Redux DevTools for state management
```

---

## Performance Tips

1. **Pagination**: Always use pagination for lists
2. **Filtering**: Use server-side filtering when possible
3. **Lazy Loading**: Load data only when needed
4. **Caching**: Cache API responses appropriately
5. **Indexes**: Create database indexes for searched fields

---

## Security Checklist

- [ ] JWT token validation on protected routes
- [ ] Password hashing with bcryptjs
- [ ] Environment variables for secrets
- [ ] CORS configured properly
- [ ] Input validation on backend
- [ ] Error messages don't leak info
- [ ] SQL/NoSQL injection prevention
- [ ] HTTPS in production
- [ ] Rate limiting implemented
- [ ] Regular dependency updates

---

## Useful Commands

### Backend
```bash
npm install          # Install dependencies
npm start            # Run server
npm run dev          # Run with nodemon (auto-reload)
node seed.js         # Run seed script (if created)
```

### Frontend
```bash
npm install          # Install dependencies
npm start            # Run dev server
npm build            # Build for production
npm test             # Run tests (if configured)
```

### Database
```bash
mongosh              # Connect to MongoDB
show databases       # List databases
use crm_db          # Select database
show collections     # List collections
db.users.find()      # Query collection
```

---

## Quick Fixes

### Clear All Data
```javascript
// In MongoDB shell
db.users.deleteMany({})
db.clients.deleteMany({})
db.leads.deleteMany({})
db.tasks.deleteMany({})
db.notes.deleteMany({})
```

### Reset Admin User
```javascript
db.users.updateMany({}, { $set: { role: "user" } })
```

### Check API Connection
```bash
curl http://localhost:5000/health
# Should return: {"status":"OK","message":"Server is running"}
```

---

## Feature Checklist

- [ ] Authentication working
- [ ] Clients CRUD working
- [ ] Leads CRUD working
- [ ] Tasks CRUD working
- [ ] Notes working
- [ ] Dashboard displaying data
- [ ] Search and filter working
- [ ] Pagination working
- [ ] Responsive design working
- [ ] Error messages displaying
- [ ] Role-based access working

---

## Resources

- Express: https://expressjs.com
- React: https://react.dev
- MongoDB: https://docs.mongodb.com
- Mongoose: https://mongoosejs.com
- JWT: https://jwt.io

---

**Happy coding! 🚀**
