# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Pages        │  │ Components   │  │ Services/API    │  │
│  ├──────────────┤  ├──────────────┤  ├─────────────────┤  │
│  │ Dashboard    │  │ Navigation   │  │ axios client    │  │
│  │ Clients      │  │ Forms        │  │ Auth Service    │  │
│  │ Leads        │  │ Lists        │  │ Client Service  │  │
│  │ Tasks        │  │ Cards        │  │ Lead Service    │  │
│  │ Auth         │  │ Stats        │  │ Task Service    │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                    │                                         │
│              Context/State Management                        │
│              (AuthContext - JWT Token)                       │
└─────────────────────────────────────────────────────────────┘
                         │
            HTTP/HTTPS REST API (JSON)
                         │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Routes       │  │ Controllers  │  │ Middleware      │  │
│  ├──────────────┤  ├──────────────┤  ├─────────────────┤  │
│  │ Auth         │  │ Auth         │  │ auth.js         │  │
│  │ Clients      │  │ Clients      │  │ authorize.js    │  │
│  │ Leads        │  │ Leads        │  │ errorHandler    │  │
│  │ Tasks        │  │ Tasks        │  │                 │  │
│  │ Notes        │  │ Notes        │  │ CORS            │  │
│  │ Dashboard    │  │ Dashboard    │  │ Helmet          │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                    │                                         │
│  ┌────────────────────────────────────┐                    │
│  │  Mongoose Models & Schemas         │                    │
│  ├────────────────────────────────────┤                    │
│  │ User, Client, Lead, Task, Note     │                    │
│  │ Indexes, Validations, Methods      │                    │
│  └────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
                         │
                  MongoDB Driver
                         │
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Collections:                                         │  │
│  │ - users (authentication & user data)                │  │
│  │ - clients (customer information)                    │  │
│  │ - leads (sales opportunities)                       │  │
│  │ - tasks (action items)                              │  │
│  │ - notes (communications & comments)                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Authentication Flow
```
User Input (Login) 
    ↓
Frontend sends credentials (encrypted over HTTPS)
    ↓
Backend validates credentials against hashed passwords
    ↓
Backend generates JWT token
    ↓
Frontend stores token in localStorage
    ↓
Frontend includes token in all subsequent requests
    ↓
Backend validates token on protected routes
```

### 2. CRUD Operation Flow (Example: Create Client)
```
User fills form and clicks Save
    ↓
Frontend validates client data
    ↓
Frontend sends POST request with token
    ↓
Backend auth middleware validates token
    ↓
Backend clientController.createClient processes request
    ↓
Mongoose saves to MongoDB with validation
    ↓
Backend returns created client with populated references
    ↓
Frontend updates state and displays success message
```

## Component Hierarchy

```
App
├── Router
│   ├── PublicRoutes
│   │   ├── /login → Login
│   │   └── /register → Register
│   ├── PrivateRoutes (protected by PrivateRoute component)
│   │   ├── /dashboard → Dashboard
│   │   ├── /clients → Clients
│   │   ├── /clients/:id → ClientDetail
│   │   ├── /leads → Leads
│   │   ├── /leads/:id → LeadDetail
│   │   ├── /tasks → Tasks
│   │   └── /tasks/:id → TaskDetail
│   └── Navigation (shown when authenticated)
│       ├── Logo & Brand
│       ├── Nav Links
│       ├── User Name
│       └── Logout Button
└── AuthContext.Provider (global auth state)
```

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: String ('admin', 'user'),
  department: String,
  isActive: Boolean,
  profileImage: String,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Clients Collection
```javascript
{
  _id: ObjectId,
  companyName: String,
  contactName: String,
  email: String,
  phone: String,
  website: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  industry: String,
  revenue: Number,
  status: String ('active', 'inactive', 'prospect'),
  notes: String,
  assignedTo: ObjectId (ref: User),
  tags: [String],
  customFields: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### Leads Collection
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  company: String,
  status: String ('new', 'contacted', 'qualified', 'proposal', 'converted', 'lost'),
  source: String ('website', 'referral', 'social-media', 'email', 'event', 'other'),
  value: Number,
  probability: Number (0-100),
  assignedTo: ObjectId (ref: User),
  relatedClient: ObjectId (ref: Client),
  notes: String,
  tags: [String],
  lastContacted: Date,
  nextFollowUp: Date,
  customFields: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### Tasks Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  status: String ('todo', 'in-progress', 'completed', 'cancelled'),
  priority: String ('low', 'medium', 'high', 'urgent'),
  dueDate: Date,
  startDate: Date,
  assignedTo: ObjectId (ref: User),
  createdBy: ObjectId (ref: User),
  relatedClient: ObjectId (ref: Client),
  relatedLead: ObjectId (ref: Lead),
  category: String ('call', 'email', 'meeting', 'follow-up', 'other'),
  completedDate: Date,
  attachments: [String],
  reminders: [Date],
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Notes Collection
```javascript
{
  _id: ObjectId,
  content: String,
  createdBy: ObjectId (ref: User),
  relatedClient: ObjectId (ref: Client),
  relatedLead: ObjectId (ref: Lead),
  type: String ('note', 'comment', 'activity', 'email'),
  attachments: [String],
  isPrivate: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## API Security

1. **JWT Authentication**
   - Token stored in localStorage
   - Sent via Authorization header: `Bearer <token>`
   - Validated on every protected route

2. **Password Security**
   - Hashed using bcryptjs with salt rounds
   - Minimum 6 characters
   - Compared using secure comparison

3. **Authorization**
   - Role-based access control (RBAC)
   - Admin-only endpoints for user management
   - Users can only modify their own data

4. **Input Validation**
   - Email format validation
   - Required field validation
   - Type coercion prevention
   - Mongoose schema validation

5. **Headers & CORS**
   - Helmet.js for secure headers
   - CORS enabled for frontend URL only
   - Content-Type validation

## Scalability Considerations

### For Production:

1. **Database**
   - Use MongoDB Atlas for managed database
   - Enable backups and replication
   - Add indexes on frequently queried fields
   - Consider sharding for large datasets

2. **Backend**
   - Use load balancing (AWS ELB, Nginx)
   - Implement caching (Redis)
   - Use CDN for static assets
   - Implement request queuing for heavy operations

3. **Frontend**
   - Code splitting and lazy loading
   - Implement service workers for offline support
   - Optimize images and assets
   - Use CDN for distribution

4. **Infrastructure**
   - Use containerization (Docker)
   - Implement auto-scaling
   - Monitor performance and logs
   - Set up CI/CD pipeline

## State Management Flow

```
AuthContext (Global)
├── user (current logged-in user)
├── token (JWT token)
├── isAuthenticated (boolean)
├── login() → sets user & token
├── logout() → clears user & token
└── updateProfile() → updates user data

Component Local State
├── Dashboard: stats, loading
├── Clients: clients array, filters, pagination
├── Leads: leads array, filters, pagination
├── Tasks: tasks array, filters
└── Forms: formData object for controlled inputs
```

## Performance Optimizations

1. **Frontend**
   - Lazy load routes
   - Memoize components with React.memo
   - Use useCallback for event handlers
   - Implement virtual scrolling for large lists

2. **Backend**
   - Query pagination (default 10 items per page)
   - Index frequently searched fields
   - Use projection to return only needed fields
   - Implement response caching

3. **Network**
   - Use gzip compression
   - Minimize bundle size
   - Enable browser caching
   - Use HTTPS

## Error Handling

- **Frontend**: Try-catch blocks, error state, user-friendly messages
- **Backend**: Custom error middleware, HTTP status codes, detailed logs
- **Database**: Validation errors, duplicate key errors, connection errors
- **Network**: Retry logic, timeout handling, offline detection
