# StudyHub

A full-stack social network for university students — share posts, join study groups, chat in real time, and track activity statistics.

---

## Tech Stack

**Backend**
- Node.js + Express (MVC architecture)
- MongoDB + Mongoose
- Socket.io (real-time chat + notifications)
- JWT authentication + bcrypt
- Multer (file uploads — images & videos)

**Frontend**
- React 18 + React Router v6
- D3.js (bar chart + pie chart)
- jQuery + AJAX (live user search)
- CSS Custom Properties design system (light/dark theme)
- Socket.io client

---

## Features

### Authentication
- Register with name, email, password, department, year
- Login with JWT — token stored in localStorage
- Protected routes redirect to login when unauthenticated

### Feed
- Create posts with type (Question / Material / Announcement), tags, and optional media (image or video)
- Like and unlike posts
- Comment on posts; delete your own comments (post authors and group admins can also delete any comment)
- Edit and delete your own posts
- Skeleton loading placeholders while data fetches

### Groups
- Browse all groups in a responsive two-column layout
- Private groups require admin approval to join
- Group detail page: member list, post feed, join/leave/request actions
- Search groups by name, year, semester, and department (advanced search)

### Real-time Chat
- One-on-one messaging via Socket.io rooms
- Chat history persisted in MongoDB
- Typing indicator
- JWT-authenticated socket connection

### Notifications
- Real-time bell icon in the navbar with unread badge count
- Notifications for: likes, comments, friend requests, group join requests, group approvals
- Mark all as read; delete individual notifications
- Powered by Socket.io — each logged-in user joins a personal room on connect

### Search
- **Groups tab** — filter by name, year, semester, department
- **Posts tab** — filter by keyword, type, date range, tag
- **Users tab** — live jQuery + AJAX search (type 2+ characters for instant results)

### Profile
- Canvas API banner with gradient background and decorative circles
- Edit name, department, year
- Add / remove friends
- Message button links directly to chat
- View own posts on profile page
- Delete account

### Statistics
- Bar chart: posts per month (D3.js with gradient bars)
- Pie chart: post type distribution (D3.js donut chart)
- Filter charts by group
- Theme-aware colors (light / dark mode)
- Skeleton loading for charts

### Dark Mode
- Full dark/light theme toggle in the navbar
- Persisted to `localStorage`
- 70+ CSS custom properties — all components update automatically

### Responsive Design
- Hamburger menu on mobile (768 px and below)
- Two-column group layout collapses to single column on small screens

---

## CSS3 Requirements

| Requirement | Where used |
|---|---|
| `@font-face` | App.css — Rubik font |
| `border-radius` | Cards, avatars, buttons, badges |
| `text-shadow` | Page title, auth header |
| `transition` | All interactive elements |
| `multiple-columns` | Groups page grid |
| `backdrop-filter: blur` | Glassmorphism navbar + dropdowns |
| Canvas API | Profile banner (ProfilePage) |
| HTML5 Video | Media posts in PostCard |
| D3.js charts | StatsPage (bar + pie) |
| jQuery + AJAX | Live user search in SearchPage |

---

## Project Structure

```
studyhub/
├── server/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── groupController.js
│   │   ├── messageController.js
│   │   ├── notificationController.js
│   │   ├── postController.js
│   │   ├── statsController.js
│   │   └── userController.js
│   ├── models/
│   │   ├── Group.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   ├── Post.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── groupRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── postRoutes.js
│   │   ├── statsRoutes.js
│   │   └── userRoutes.js
│   ├── uploads/           # Uploaded media files (gitignored)
│   ├── .env               # Environment variables (not committed)
│   ├── .env.example       # Template for environment setup
│   ├── seed.js            # Database seed (16 users, 7 groups, ~50 posts)
│   └── server.js
├── client/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── api/
│       │   └── axios.js
│       ├── components/
│       │   └── common/
│       │       ├── Navbar.jsx
│       │       ├── PostCard.jsx
│       │       └── PostForm.jsx
│       ├── pages/
│       │   ├── ChatPage.jsx
│       │   ├── FeedPage.jsx
│       │   ├── GroupDetailPage.jsx
│       │   ├── GroupsPage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── ProfilePage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── SearchPage.jsx
│       │   └── StatsPage.jsx
│       ├── App.css
│       └── App.jsx
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally on port 27017

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/adanisiv/studyhub.git
cd studyhub

# 2. Install server dependencies
cd server
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env — set your JWT_SECRET

# 4. Seed the database
node seed.js

# 5. Start the server
node server.js

# 6. In a new terminal — install and start the client
cd ../client
npm install
npm start
```

App runs at `http://localhost:3000`.

### Seed Accounts

All seed accounts use the password `123456`.

| Name | Email |
|---|---|
| Dana Cohen | dana@test.com |
| Yoni Levi | yoni@test.com |
| Noa Shapiro | noa@test.com |
| Admin User | admin@test.com |
| + 12 more | ... |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
MONGO_URI=mongodb://localhost:27017/studyhub
JWT_SECRET=your_secret_key_here
PORT=5000
```

---

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |

### Users
| Method | Path | Description |
|---|---|---|
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/:id` | Update profile |
| DELETE | `/api/users/:id` | Delete account |
| POST | `/api/users/:id/friend` | Add friend |
| DELETE | `/api/users/:id/friend` | Remove friend |
| GET | `/api/users/search?name=` | Search users by name |

### Posts
| Method | Path | Description |
|---|---|---|
| GET | `/api/posts?groupId=` | List posts (optional group filter) |
| GET | `/api/posts/my` | Own posts |
| GET | `/api/posts/search` | Advanced post search |
| POST | `/api/posts` | Create post |
| PUT | `/api/posts/:id` | Edit post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/like` | Toggle like |
| POST | `/api/posts/:id/comment` | Add comment |
| DELETE | `/api/posts/:id/comment/:commentId` | Delete comment |

### Groups
| Method | Path | Description |
|---|---|---|
| GET | `/api/groups` | List all groups |
| GET | `/api/groups/search` | Advanced group search |
| GET | `/api/groups/:id` | Group details |
| POST | `/api/groups` | Create group |
| POST | `/api/groups/:id/join` | Join or request to join |
| POST | `/api/groups/:id/approve/:userId` | Approve join request |
| DELETE | `/api/groups/:id/leave` | Leave group |

### Notifications
| Method | Path | Description |
|---|---|---|
| GET | `/api/notifications` | List notifications |
| GET | `/api/notifications/unread` | Unread count |
| PUT | `/api/notifications/read-all` | Mark all read |
| DELETE | `/api/notifications/:id` | Delete notification |

### Upload
| Method | Path | Description |
|---|---|---|
| POST | `/api/upload` | Upload image or video (max 10 MB) |

### Stats
| Method | Path | Description |
|---|---|---|
| GET | `/api/stats/posts-per-month` | Monthly post counts |
| GET | `/api/stats/post-types` | Post type distribution |

---

## Socket.io Events

Clients authenticate with `{ auth: { token } }` on connect. The server verifies the JWT and auto-joins the user to `user_<userId>` for personal notifications.

### Chat
| Event | Direction | Payload |
|---|---|---|
| `join_room` | Client → Server | `roomId` |
| `chat_history` | Server → Client | `Message[]` |
| `send_message` | Client → Server | `{ roomId, senderId, text }` |
| `receive_message` | Server → Client | `Message` |
| `typing` | Client → Server | `{ roomId, userName }` |
| `stop_typing` | Client → Server | `{ roomId }` |
| `user_typing` | Server → Client | `{ userName }` |
| `user_stop_typing` | Server → Client | — |

### Notifications
| Event | Direction | Payload |
|---|---|---|
| `new_notification` | Server → Client | `Notification` |
