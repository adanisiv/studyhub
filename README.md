# StudyHub — Social Network for Students

## Quick Start

### 1. Install MongoDB
Make sure MongoDB is running locally on port 27017.

### 2. Start the server
```bash
cd server
npm install
npm run seed      # populate DB with demo data
npm run dev       # starts on http://localhost:5000
```

### 3. Start the client
```bash
cd client
npm install
npm start         # starts on http://localhost:3000
```

### 4. Login
After seeding, use any of these accounts (password is `123456` for all):
| Name           | Email            | Role    |
|----------------|------------------|---------|
| Dana Cohen     | dana@test.com    | student |
| Yoni Levi      | yoni@test.com    | student |
| Noa Mizrahi    | noa@test.com     | student |
| Amit Shapira   | amit@test.com    | student |
| Maya Peretz    | maya@test.com    | student |
| Oren Katz      | oren@test.com    | student |
| Admin User     | admin@test.com   | admin   |

---

## Project Requirements Checklist

### Architecture
- [x] Node.js + Express server
- [x] React client
- [x] MongoDB with Mongoose
- [x] MVC pattern (models/ controllers/ routes/ separated)

### 3 Models with full CRUD + Search
- [x] **User** — Create (register), Read (profile), Update (edit profile), Delete (delete account), List (all users), Search (by name/dept/year)
- [x] **Group** — Create, Read, Update (admin only), Delete (admin only), List, Search (advanced)
- [x] **Post** — Create, Read, Update (author/admin), Delete (author/admin), List (feed), Search (advanced)

### 2 Advanced Searches (3+ parameters each)
- [x] **Group search** — name, year, semester, department (4 params)
- [x] **Post search** — keyword, type, date range, tag (4 params)

### Permissions / Authorization
- [x] JWT authentication (register/login)
- [x] bcrypt password hashing
- [x] Users can only edit/delete their own posts
- [x] Group admin can edit/delete group + approve members + delete any post in group
- [x] Private groups — only members can view posts
- [x] Each user sees only their own private data

### Feed
- [x] Shows posts from user's groups + friends' personal posts

### Socket.io Chat
- [x] Real-time messaging between users
- [x] Chat history saved to MongoDB
- [x] Typing indicator ("user is typing...")
- [x] Room-based (each conversation = separate room)

### jQuery + Ajax
- [x] Live user search using jQuery $.ajax() on keyup
- [x] jQuery loaded from CDN in index.html
- [x] See SearchPage.jsx → "Search Users (jQuery)" tab

### React Features
- [x] **Video** — `<video>` element in PostCard for video posts
- [x] **Canvas** — Profile banner drawn with Canvas API (ProfilePage.jsx)

### CSS3 Features
- [x] **@font-face** — Rubik font loaded in index.html
- [x] **border-radius** — Used on cards, buttons, avatars, tags
- [x] **text-shadow** — On .navbar-brand and .page-title
- [x] **transition** — On buttons, cards, nav links, post cards
- [x] **multiple-columns** — Groups page uses column-count: 2

### D3.js Charts (2 graphs, dynamic data from DB)
- [x] **Bar chart** — Posts per month (with group filter)
- [x] **Pie chart** — Post type distribution (with group filter)

### Error Handling
- [x] Server-side validation on all inputs
- [x] Client-side form validation
- [x] Global error handler in Express
- [x] Axios interceptor for 401 responses
- [x] Try/catch on every controller

### Seed Data
- [x] 7 users with friendships
- [x] 4 groups (1 private with pending request)
- [x] 20+ posts across groups + personal
- [x] Chat messages between Dana and Yoni

---

## Folder Structure

```
studyhub/
├── server/
│   ├── config/db.js           # MongoDB connection
│   ├── middleware/auth.js     # JWT verification
│   ├── models/
│   │   ├── User.js
│   │   ├── Group.js
│   │   ├── Post.js
│   │   └── Message.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── groupController.js
│   │   ├── postController.js
│   │   └── statsController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── groupRoutes.js
│   │   ├── postRoutes.js
│   │   └── statsRoutes.js
│   ├── socket/chatHandler.js  # Socket.io events
│   ├── server.js              # Entry point
│   ├── seed.js                # Populate DB
│   └── .env
├── client/
│   ├── public/index.html      # jQuery CDN + @font-face
│   ├── src/
│   │   ├── api/axios.js       # Axios with JWT interceptor
│   │   ├── App.jsx            # Router + auth state
│   │   ├── App.css            # All CSS3 features
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── FeedPage.jsx
│   │   │   ├── GroupsPage.jsx
│   │   │   ├── GroupDetailPage.jsx
│   │   │   ├── SearchPage.jsx     # jQuery Ajax + 2 advanced searches
│   │   │   ├── ProfilePage.jsx    # Canvas
│   │   │   ├── ChatPage.jsx       # Socket.io
│   │   │   └── StatsPage.jsx      # D3.js
│   │   └── components/
│   │       └── common/
│   │           ├── Navbar.jsx
│   │           ├── PostCard.jsx   # Video support
│   │           └── PostForm.jsx
│   └── package.json
└── README.md
```

---

## API Endpoints

### Auth
| Method | Route              | Description       |
|--------|--------------------|--------------------|
| POST   | /api/auth/register | Create account     |
| POST   | /api/auth/login    | Login, get JWT     |
| GET    | /api/auth/me       | Get current user   |

### Users
| Method | Route                  | Description              |
|--------|------------------------|--------------------------|
| GET    | /api/users             | List all users           |
| GET    | /api/users/search      | Search by name/dept/year |
| GET    | /api/users/:id         | Get user by ID           |
| PUT    | /api/users/:id         | Update own profile       |
| DELETE | /api/users/:id         | Delete own account       |
| POST   | /api/users/:id/friend  | Add friend               |
| DELETE | /api/users/:id/friend  | Remove friend            |

### Groups
| Method | Route                     | Description                    |
|--------|---------------------------|--------------------------------|
| POST   | /api/groups               | Create group                   |
| GET    | /api/groups               | List groups                    |
| GET    | /api/groups/search        | Advanced search (4 params)     |
| GET    | /api/groups/:id           | Get group details              |
| PUT    | /api/groups/:id           | Update group (admin only)      |
| DELETE | /api/groups/:id           | Delete group (admin only)      |
| POST   | /api/groups/:id/join      | Join / request to join         |
| POST   | /api/groups/:id/approve   | Approve member (admin only)    |
| POST   | /api/groups/:id/leave     | Leave group                    |

### Posts
| Method | Route                       | Description                  |
|--------|-----------------------------|------------------------------|
| POST   | /api/posts                  | Create post                  |
| GET    | /api/posts/feed             | Get feed                     |
| GET    | /api/posts/my               | Get my posts                 |
| GET    | /api/posts/search           | Advanced search (4 params)   |
| GET    | /api/posts/group/:groupId   | Posts in a group             |
| GET    | /api/posts/:id              | Get post by ID               |
| PUT    | /api/posts/:id              | Update post                  |
| DELETE | /api/posts/:id              | Delete post                  |
| POST   | /api/posts/:id/comment      | Add comment                  |
| POST   | /api/posts/:id/like         | Toggle like                  |

### Stats (D3.js)
| Method | Route                       | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /api/stats/posts-per-month  | Posts per month           |
| GET    | /api/stats/post-types       | Post type distribution   |

### Socket.io Events
| Event           | Direction       | Description                |
|-----------------|-----------------|----------------------------|
| join_room       | client → server | Join chat room             |
| chat_history    | server → client | Previous messages          |
| send_message    | client → server | Send a message             |
| receive_message | server → client | New message broadcast      |
| typing          | client → server | User started typing        |
| user_typing     | server → client | Show typing indicator      |
| stop_typing     | both ways       | Clear typing indicator     |
