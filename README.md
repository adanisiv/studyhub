# StudyHub

A social network for university students. Share posts, join study groups, chat in real time, and explore activity statistics.

Built as the final project for the Android 2 course.

---

## Tech Stack

**Backend**
- Node.js + Express (MVC structure)
- MongoDB + Mongoose
- Socket.io for real-time chat and notifications
- JWT authentication with bcrypt password hashing
- Multer for file uploads

**Frontend**
- React 18 with React Router v6
- D3.js for charts (bar / pie / line)
- jQuery + AJAX for live user search
- Socket.io client
- CSS custom properties with light + dark theme

---

## Features

- **Auth** — register, login (JWT), protected routes
- **Feed** — create, edit, delete posts; like, comment, infinite scroll
- **Hashtags** — clickable `#tags` open a dedicated tag page
- **Groups** — public and private groups, admin approval flow
- **Real-time chat** — one-on-one messaging with typing indicator, read receipts, and message search
- **Notifications** — bell icon with unread badge, real-time updates
- **Search**
  - Groups: by name / year / semester / department / tag
  - Posts: by keyword / type / tag / date range
  - Users: live jQuery + AJAX search by name
- **Profile** — Canvas API banner, achievements, personal stats, friends list
- **Statistics dashboard** — three D3.js charts (bar, donut, line) with group filter
- **Dark mode** toggle, persisted to localStorage
- **Responsive design** for mobile and desktop

---

## CSS3 Features Used

| Feature | Where |
|---|---|
| `@font-face` | `client/public/index.html` — Plus Jakarta Sans |
| `border-radius` | Cards, buttons, avatars |
| `text-shadow` | Hashtag header, auth pages |
| `transition` | All interactive elements |
| `multiple-columns` | Groups page masonry layout |

---

## Course Requirement Highlights

- **MVC** — separate `models/`, `controllers/`, `routes/` folders on the server
- **3 main models** with full CRUD + Search — User, Group, Post
- **2 advanced searches** with 3+ parameters — Groups search and Posts search
- **jQuery + AJAX** — live user search in `SearchPage.jsx` Users tab
- **React Video** — `<video>` element in `PostCard.jsx`
- **React Canvas** — profile banner in `ProfilePage.jsx`
- **Socket.io chat** — `chatHandler.js` on the server, `ChatPage.jsx` on the client
- **D3.js charts** — three charts in `StatsPage.jsx`, all data from MongoDB

---

## Project Structure

```
studyhub-run/
├── server/
│   ├── controllers/      — request handlers
│   ├── models/           — Mongoose schemas
│   ├── routes/           — Express routers
│   ├── middleware/       — auth + validation
│   ├── socket/           — Socket.io chat handler
│   ├── config/           — DB connection
│   ├── uploads/          — uploaded files (gitignored)
│   ├── seed.js           — populate DB with sample data
│   └── server.js         — server entry point
└── client/
    ├── public/
    │   └── index.html    — loads jQuery + Plus Jakarta Sans
    └── src/
        ├── api/          — axios instance
        ├── components/   — shared components
        ├── pages/        — route pages
        ├── App.jsx       — router + auth state
        └── App.css       — global styles
```

---

## Getting Started

### Prerequisites
- Node.js 18 or higher
- MongoDB running locally on port 27017

### Installation

```bash
# Clone
git clone https://github.com/adanisiv/studyhub.git
cd studyhub

# Install server dependencies
cd server
npm install

# Set up environment variables
cp .env.example .env

# Seed the database with sample users, groups, and posts
node seed.js

# Start the server (port 5000)
node server.js

# In a separate terminal — start the client (port 3000)
cd ../client
npm install
npm start
```

The app runs at http://localhost:3000.

### Sample Login

All seed accounts use password `123456`.

| Name | Email |
|---|---|
| Dana Cohen | dana@test.com |
| Yoni Levi | yoni@test.com |
| Admin User | admin@studyhub.com (password: `admin123`) |

The seed file creates 25 users across 7 departments, plus groups, posts, comments, friendships, and chat messages.

---

## Environment Variables

`.env` file in the `server/` folder:

```
MONGO_URI=mongodb://localhost:27017/studyhub
JWT_SECRET=your_secret_here
PORT=5000
```

---

## API Reference

### Auth — `/api/auth`
- `POST /register` — create account, returns JWT
- `POST /login` — sign in, returns JWT
- `GET /me` — current user (requires token)

### Users — `/api/users`
- `GET /` — list users
- `GET /search?name=&department=&year=` — search users (3 filters)
- `GET /:id` — user profile
- `PUT /:id` — update own profile
- `DELETE /:id` — delete own account
- `POST /:id/friend` — add friend
- `DELETE /:id/friend` — remove friend

### Groups — `/api/groups`
- `GET /` — list groups
- `GET /search?name=&year=&semester=&department=&tag=` — advanced search (5 filters)
- `GET /:id` — group details
- `POST /` — create group
- `PUT /:id` — edit (admin only)
- `DELETE /:id` — delete (admin only)
- `POST /:id/join` — join or request to join
- `POST /:id/approve` — approve a pending request (admin only)
- `POST /:id/leave` — leave the group

### Posts — `/api/posts`
- `GET /feed?page=&limit=` — paginated feed
- `GET /my` — own posts
- `GET /search?keyword=&type=&dateFrom=&dateTo=&tag=` — advanced search (5 filters)
- `GET /group/:groupId` — posts in a group
- `GET /:id` — single post
- `POST /` — create
- `PUT /:id` — edit
- `DELETE /:id` — delete
- `POST /:id/like` — toggle like
- `POST /:id/comment` — add comment
- `DELETE /:postId/comment/:commentId` — delete comment

### Messages — `/api/messages`
- `GET /conversations` — list conversations with last message and unread count
- `GET /search?roomId=&keyword=&dateFrom=&dateTo=` — search messages in a room
- `GET /history/:roomId` — load room history

### Notifications — `/api/notifications`
- `GET /` — list (most recent 30)
- `GET /unread` — unread count for badge
- `PUT /read-all` — mark all read
- `DELETE /:id` — delete one

### Stats — `/api/stats`
- `GET /dashboard` — KPI counts
- `GET /trending` — trending tags and top groups
- `GET /posts-per-month?groupId=` — bar chart data
- `GET /post-types?groupId=` — pie chart data
- `GET /daily-activity?groupId=` — line chart data (last 30 days)
- `GET /user/:userId` — personal stats for the profile page

### Uploads — `/api/upload`
- `POST /` — upload an image, video, or document (max 25 MB)

---

## Socket.io Events

Clients authenticate by sending `{ auth: { token } }` on connect.

### Chat events
- `join_room` (client → server) — open a conversation
- `chat_history` (server → client) — message history for the room
- `send_message` (client → server) — send a message
- `receive_message` (server → client) — new message in the room
- `mark_read` (client → server) — mark messages as read
- `messages_read` (server → client) — other side read your messages
- `typing` / `stop_typing` — typing indicator
- `user_online` / `user_offline` — presence broadcast

### Notification events
- `new_notification` (server → client) — push a fresh notification

---
